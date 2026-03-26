import { v7 as uuidv7 } from "uuid";
import { redis } from "../../infrastructure/redis/redis-client";
import { sendToUser } from "../../infrastructure/ws/session-manager";
import { startPlayerTimer } from "../game/timer";
import {
  WsMessageType,
  GameStatus,
  GameUser,
  PLAYER_COLOR,
  PlayerInfo,
} from "../../types/types";
import { Keys } from "../../lib/keys";
import { db } from "../../infrastructure/db/db";
import { user } from "../../infrastructure/db/schema";
import { eq } from "drizzle-orm";

const MATCHMAKING_QUEUE_KEY = "matchmaking:queue";
const MATCHMAKING_INFO_KEY = "matchmaking:info";

const CLAIM_OPPONENT_LUA = `
local candidates = redis.call('ZRANGEBYSCORE', KEYS[1], ARGV[1], ARGV[2], 'LIMIT', 0, 2)
for i=1, #candidates do
  if candidates[i] ~= ARGV[3] then
    redis.call('ZREM', KEYS[1], candidates[i])
    return candidates[i]
  end
end
return nil
`;

function parseTimeControl(tc: string): { baseMs: number } {
  const [minsPart] = tc.split("+");
  const mins = parseInt(minsPart ?? "", 10);
  if (isNaN(mins)) throw new Error(`Invalid time control: ${tc}`);
  return { baseMs: mins * 60 * 1000 };
}

export async function handleJoinQueue(
  userId: string,
  timeControl: string,
): Promise<void> {
  const LOCK_KEY = `lock:matchmaking:${userId}`;

  const isSearching = await redis.set(LOCK_KEY, "locked", "EX", 60, "NX");

  if (!isSearching) {
    console.warn(
      `[Queue] ${userId} already has an active search loop. Ignoring.`,
    );
    return;
  }

  try {
    const userData = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!userData) return;

    const rating = userData.rating;

    const playerInfo = {
      id: userId,
      username: userData.username,
      rating: userData.rating,
      image: userData.image,
    };

    await redis.hset(MATCHMAKING_INFO_KEY, userId, JSON.stringify(playerInfo));
    await redis.zadd(MATCHMAKING_QUEUE_KEY, rating, userId);

    const searchTiers = [100, 300, 500, 1000, 1500];

    for (const range of searchTiers) {
      const stillInQueue = await redis.zscore(MATCHMAKING_QUEUE_KEY, userId);

      if (!stillInQueue) {
        return;
      }

      const minRating = rating - range;
      const maxRating = rating + range;

      const opponentId = (await redis.eval(
        CLAIM_OPPONENT_LUA,
        1,
        MATCHMAKING_QUEUE_KEY,
        minRating.toString(),
        maxRating.toString(),
        userId,
      )) as string | null;

      if (opponentId) {
        await redis.zrem(MATCHMAKING_QUEUE_KEY, userId);

        const opponentDataStr = await redis.hget(
          MATCHMAKING_INFO_KEY,
          opponentId,
        );
        const opponentInfo = opponentDataStr
          ? JSON.parse(opponentDataStr)
          : {
              id: opponentId,
              username: "Unknown",
              rating: 1200,
              image: null,
            };

        await redis.hdel(MATCHMAKING_INFO_KEY, userId, opponentId);

        await createNewMatch(playerInfo, opponentInfo, timeControl);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 10000));
    }

    const finalCheck = await redis.zrem(MATCHMAKING_QUEUE_KEY, userId);
    if (finalCheck) {
      await redis.hdel(MATCHMAKING_INFO_KEY, userId);
      await sendToUser(userId, {
        type: WsMessageType.MATCHMAKING_TIMEOUT,
        payload: { message: "No suitable opponent found. Try again?" },
      });
    }
  } finally {
    await redis.del(LOCK_KEY);
  }
}

export async function handleLeaveQueue(userId: string): Promise<void> {
  await redis.zrem(MATCHMAKING_QUEUE_KEY, userId);
  await redis.hdel(MATCHMAKING_INFO_KEY, userId);
}

export async function createNewMatch(
  player1: PlayerInfo,
  player2: PlayerInfo,
  timeControl: string,
  forceP1White?: boolean,
): Promise<void> {
  const gameId = uuidv7();
  const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const { baseMs } = parseTimeControl(timeControl);
  const now = Date.now();

  const isP1White =
    forceP1White !== undefined ? forceP1White : Math.random() > 0.5;
  const whiteUser = isP1White ? player1 : player2;
  const blackUser = isP1White ? player2 : player1;

  await redis.hset(Keys.game(gameId), {
    whiteUser: JSON.stringify({ ...whiteUser, timeLeftMs: baseMs }),
    blackUser: JSON.stringify({ ...blackUser, timeLeftMs: baseMs }),
    fen: initialFen,
    pgn: "",
    status: GameStatus.IN_PROGRESS,
    turn: PLAYER_COLOR.WHITE,
    timeControl,
    lastMoveTimestamp: now,
  });

  console.log(
    `[Game] Started | ID: ${gameId} | ${whiteUser.id} (W) vs ${blackUser.id} (B)`,
  );

  await Promise.all([
    redis.set(Keys.userActiveGame(whiteUser.id), gameId),
    redis.set(Keys.userActiveGame(blackUser.id), gameId),
  ]);

  const payloadBase = {
    gameId,
    fen: initialFen,
    timeControl,
    white: whiteUser,
    black: blackUser,
  };

  await Promise.all([
    sendToUser(whiteUser.id, {
      type: WsMessageType.GAME_STARTED,
      payload: { ...payloadBase, color: "white" },
    }),
    sendToUser(blackUser.id, {
      type: WsMessageType.GAME_STARTED,
      payload: { ...payloadBase, color: "black" },
    }),
  ]);

  await startPlayerTimer(gameId, whiteUser.id, blackUser.id, baseMs);
}
