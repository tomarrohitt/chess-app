import { parseGameState } from "../../lib/state";
import {
  GameChatMessage,
  GameStatus,
  GameSyncState,
  PLAYER_COLOR,
  GameUserSchema,
  WsMessageType,
} from "../../types/types";
import { Keys } from "../../lib/keys";
import { redis } from "../../infrastructure/redis/redis-client";
import { cancelTimer, startPlayerTimer } from "./timer";
import { flushGameToDatabase } from "./storage";
import {
  sendToUser,
  broadcastGameUpdate,
} from "../../infrastructure/ws/session-manager";
import {
  getCapturedPieces,
  validateTurn,
  calculateClocks,
  applyMove,
  resolveOutcome,
} from "./engine-utils";
import { db } from "../../infrastructure/db/db";
import { games } from "../../infrastructure/db/schema";
import { eq } from "drizzle-orm";

export * from "./game-actions";
export { getCapturedPieces } from "./engine-utils";

export async function processMove(
  gameId: string,
  userId: string,
  from: string,
  to: string,
  promotion?: string,
) {
  const gameKey = Keys.game(gameId);
  const raw = await redis.hgetall(gameKey);

  if (!raw || Object.keys(raw).length === 0) {
    throw new Error("Game not found or already ended.");
  }

  const state = parseGameState(raw, gameId);
  const isWhiteTurn = validateTurn(state, userId);

  const now = Date.now();
  const { whiteTime, blackTime, elapsed, isTimeout } = calculateClocks(
    state,
    now,
  );

  await cancelTimer(gameId);

  await redis.del(Keys.drawOffer(gameId));

  if (isTimeout) {
    const winnerId = isWhiteTurn ? state.black.id : state.white.id;
    const status = GameStatus.TIME_OUT;

    await flushGameToDatabase(gameId, status, winnerId);

    const payload = {
      type: WsMessageType.GAME_OVER,
      payload: { status, winnerId, reason: "timeout" },
    };
    await broadcastGameUpdate(gameId, payload);
    return { isGameOver: true };
  }

  const playerRemainingTime = isWhiteTurn ? whiteTime : blackTime;
  const { chess, san } = applyMove(
    state,
    from,
    to,
    playerRemainingTime,
    promotion,
  );

  const moveTimes = JSON.parse(raw.moveTimes || "[]");
  moveTimes.push(elapsed);

  const { status, winnerId, isOver, reason } = resolveOutcome(chess, state);
  console.log(
    `[Move] ${userId}: ${san} | Clocks W: ${Math.floor(whiteTime / 1000)}s, B: ${Math.floor(blackTime / 1000)}s`,
  );

  if (isOver) {
    await redis.hset(gameKey, {
      fen: chess.fen(),
      pgn: chess.pgn(),
      status,
      whiteUser: JSON.stringify({ ...state.white, timeLeftMs: whiteTime }),
      blackUser: JSON.stringify({ ...state.black, timeLeftMs: blackTime }),
      moveTimes: JSON.stringify(moveTimes),
    });

    await flushGameToDatabase(gameId, status, winnerId);

    const gameOverPayload = {
      type: WsMessageType.GAME_OVER,
      payload: { status, winnerId, reason },
    };
    await broadcastGameUpdate(gameId, gameOverPayload);
  } else {
    await redis.hset(gameKey, {
      fen: chess.fen(),
      pgn: chess.pgn(),
      turn: chess.turn(),
      status,
      whiteUser: JSON.stringify({ ...state.white, timeLeftMs: whiteTime }),
      blackUser: JSON.stringify({ ...state.black, timeLeftMs: blackTime }),
      lastMoveTimestamp: now,
      moveTimes: JSON.stringify(moveTimes),
    });

    const nextId =
      chess.turn() === PLAYER_COLOR.WHITE ? state.white.id : state.black.id;
    const prevId =
      chess.turn() === PLAYER_COLOR.WHITE ? state.black.id : state.white.id;
    const nextTime =
      chess.turn() === PLAYER_COLOR.WHITE ? whiteTime : blackTime;

    if (isNaN(nextTime)) {
      console.error(
        "[Timer Critical] nextTime is NaN! State:",
        JSON.stringify(state),
      );
    }
    await startPlayerTimer(gameId, prevId, nextTime);
  }

  const capturedPieces = getCapturedPieces(chess.fen());

  return {
    newFen: chess.fen(),
    pgn: chess.pgn(),
    move: san,
    isGameOver: isOver,
    moveTimes,
    white: {
      id: state.white.id,
      timeLeftMs: whiteTime,
      capturedPieces: capturedPieces.capturedByWhite,
    },
    black: {
      id: state.black.id,
      timeLeftMs: blackTime,
      capturedPieces: capturedPieces.capturedByBlack,
    },
  };
}

export async function getSyncState(
  userId: string,
): Promise<GameSyncState | null> {
  const gameId = await redis.get(Keys.userActiveGame(userId));
  if (!gameId) return null;

  const [gameState, dbGame] = await Promise.all([
    redis.hgetall(Keys.game(gameId)),
    db.query.games.findFirst({
      where: eq(games.id, gameId),
      columns: { chatLogs: true },
    }),
  ]);

  if (
    !gameState ||
    !gameState.whiteUser ||
    !gameState.blackUser ||
    !gameState.fen
  )
    return null;

  if (gameState.status !== GameStatus.IN_PROGRESS) {
    await redis.del(Keys.userActiveGame(userId));
    return null;
  }

  const now = Date.now();
  const lastMoveAt = parseInt(gameState.lastMoveTimestamp || "0", 10);
  const elapsed = now - lastMoveAt;

  const whiteUser = GameUserSchema.parse(JSON.parse(gameState.whiteUser));
  const blackUser = GameUserSchema.parse(JSON.parse(gameState.blackUser));

  let whiteTime = whiteUser.timeLeftMs ?? 0;
  let blackTime = blackUser.timeLeftMs ?? 0;

  if (lastMoveAt > 0) {
    if (gameState.turn === PLAYER_COLOR.WHITE) whiteTime -= elapsed;
    else blackTime -= elapsed;
  }

  if (whiteTime <= 0 || blackTime <= 0) {
    const winnerId = whiteTime <= 0 ? blackUser.id : whiteUser.id;
    const status = GameStatus.TIME_OUT;
    await flushGameToDatabase(gameId, status, winnerId);

    const payload = {
      type: WsMessageType.GAME_OVER,
      payload: { status, winnerId, reason: "timeout" },
    };
    const uniqueIds = Array.from(new Set([whiteUser.id, blackUser.id]));
    await Promise.all([...uniqueIds.map((id) => sendToUser(id, payload))]);

    return null;
  }

  const capturedPieces = getCapturedPieces(gameState.fen);

  return {
    gameId,
    fen: gameState.fen,
    pgn: gameState.pgn,
    playerColor:
      whiteUser.id === userId ? PLAYER_COLOR.WHITE : PLAYER_COLOR.BLACK,
    turn: gameState.turn as PLAYER_COLOR,
    status: gameState.status as GameStatus,
    white: {
      id: whiteUser.id,
      username: whiteUser.username,
      rating: whiteUser.rating,
      image: whiteUser.image,
      timeLeftMs: Math.max(0, whiteTime),
      capturedPieces: capturedPieces.capturedByWhite,
    },
    black: {
      id: blackUser.id,
      username: blackUser.username,
      rating: blackUser.rating,
      image: blackUser.image,
      timeLeftMs: Math.max(0, blackTime),
      capturedPieces: capturedPieces.capturedByBlack,
    },
    timeControl: gameState.timeControl,
    chatMessages: (dbGame?.chatLogs as GameChatMessage[]) ?? [],
  };
}

export async function getSpectatorState(
  gameId: string,
): Promise<GameSyncState | null> {
  const [gameState, dbGame] = await Promise.all([
    redis.hgetall(Keys.game(gameId)),
    db.query.games.findFirst({
      where: eq(games.id, gameId),
      with: {
        white: {
          columns: { id: true, username: true, rating: true, image: true },
        },
        black: {
          columns: { id: true, username: true, rating: true, image: true },
        },
      },
    }),
  ]);

  // Case 1: Game is over or not in Redis. Fetch from DB.
  if (!gameState || Object.keys(gameState).length === 0) {
    if (!dbGame || !dbGame.white || !dbGame.black) return null;

    return {
      gameId,
      fen: dbGame.finalFen,
      pgn: dbGame.pgn,
      playerColor: PLAYER_COLOR.WHITE, // Spectator default
      turn: dbGame.finalFen.split(" ")[1] as PLAYER_COLOR,
      status: dbGame.status as GameStatus,
      white: {
        ...dbGame.white,
        rating: dbGame.whiteRating,
        timeLeftMs: dbGame.whiteTimeLeftMs,
        capturedPieces: dbGame.capturedByWhite,
      },
      black: {
        ...dbGame.black,
        rating: dbGame.blackRating,
        timeLeftMs: dbGame.blackTimeLeftMs,
        capturedPieces: dbGame.capturedByBlack,
      },
      timeControl: dbGame.timeControl,
      chatMessages: (dbGame.chatLogs as GameChatMessage[]) ?? [],
    };
  }

  // Case 2: Game is live in Redis.
  if (gameState.whiteUser && gameState.blackUser && gameState.fen) {
    const now = Date.now();
    const lastMoveAt = parseInt(gameState.lastMoveTimestamp || "0", 10);
    const elapsed = now - lastMoveAt;

    const whiteUser = GameUserSchema.parse(JSON.parse(gameState.whiteUser));
    const blackUser = GameUserSchema.parse(JSON.parse(gameState.blackUser));

    let whiteTime = whiteUser.timeLeftMs ?? 0;
    let blackTime = blackUser.timeLeftMs ?? 0;

    if (lastMoveAt > 0 && gameState.status === GameStatus.IN_PROGRESS) {
      if (gameState.turn === PLAYER_COLOR.WHITE) whiteTime -= elapsed;
      else blackTime -= elapsed;
    }

    const capturedPieces = getCapturedPieces(gameState.fen);

    return {
      gameId,
      fen: gameState.fen,
      pgn: gameState.pgn,
      playerColor: PLAYER_COLOR.WHITE, // Spectator default
      turn: gameState.turn as PLAYER_COLOR,
      status: gameState.status as GameStatus,
      white: {
        ...whiteUser,
        timeLeftMs: Math.max(0, whiteTime),
        capturedPieces: capturedPieces.capturedByWhite,
      },
      black: {
        ...blackUser,
        timeLeftMs: Math.max(0, blackTime),
        capturedPieces: capturedPieces.capturedByBlack,
      },
      timeControl: gameState.timeControl,
      chatMessages: (dbGame?.chatLogs as GameChatMessage[]) ?? [],
    };
  }

  return null;
}
