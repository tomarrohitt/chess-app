import { Queue, Worker } from "bullmq";
import { redis } from "../../infrastructure/redis/redis-client";
import {
  sendToUser,
  broadcastGameUpdate,
} from "../../infrastructure/ws/session-manager";
import { Keys } from "../../lib/keys";
import { GameStatus, WsMessageType, GameUserSchema } from "../../types/types";
import { flushGameToDatabase } from "./storage";

const TIMER_QUEUE_NAME = "game-timers";
const RECONNECT_QUEUE_NAME = "reconnect-grace";
const RECONNECT_GRACE_MS = 30_000;

export const timerQueue = new Queue(TIMER_QUEUE_NAME, { connection: redis });

export const timerWorker = new Worker(
  TIMER_QUEUE_NAME,
  async (job) => {
    const { gameId, loserId, winnerId } = job.data as {
      gameId: string;
      loserId: string;
      winnerId: string;
    };

    const gameState = await redis.hgetall(Keys.game(gameId));
    if (!gameState?.whiteUser || !gameState?.blackUser) {
      console.warn(`[Timer] Game ${gameId} already ended - ignoring.`);
      return;
    }

    const timeoutPayload = {
      type: WsMessageType.GAME_OVER,
      payload: { status: GameStatus.TIME_OUT, reason: "timeout", winnerId },
    };

    const uniqueIds = Array.from(new Set([winnerId, loserId]));
    await Promise.all([
      ...uniqueIds.map((id) => sendToUser(id, timeoutPayload)),
      broadcastGameUpdate(gameId, timeoutPayload, uniqueIds),
    ]);

    await flushGameToDatabase(gameId, GameStatus.TIME_OUT, winnerId);
  },
  { connection: redis },
);

timerWorker.on("failed", (job, err) => {
  console.error(`[Timer] Job ${job?.id} failed:`, err);
});

export async function startPlayerTimer(
  gameId: string,
  playerId: string,
  opponentId: string,
  timeLeftMs: number,
): Promise<void> {
  await timerQueue.add(
    "timeout",
    { gameId, loserId: playerId, winnerId: opponentId },
    {
      jobId: Keys.timerJob(gameId),
      delay: Math.max(0, timeLeftMs),
      removeOnComplete: true,
      removeOnFail: true,
    },
  );
}

export async function cancelTimer(gameId: string): Promise<void> {
  const job = await timerQueue.getJob(Keys.timerJob(gameId));
  if (job) {
    await job.remove();
  }
}

export const reconnectQueue = new Queue(RECONNECT_QUEUE_NAME, {
  connection: redis,
});

export const reconnectWorker = new Worker(
  RECONNECT_QUEUE_NAME,
  async (job) => {
    const { gameId, disconnectedUserId } = job.data as {
      gameId: string;
      disconnectedUserId: string;
    };

    const gameState = await redis.hgetall(Keys.game(gameId));
    if (!gameState?.whiteUser || !gameState?.blackUser) {
      console.warn(
        `[Reconnect] Game ${gameId} already ended - ignoring grace period expiry.`,
      );
      return;
    }

    const whiteId = GameUserSchema.parse(JSON.parse(gameState.whiteUser)).id;
    const blackId = GameUserSchema.parse(JSON.parse(gameState.blackUser)).id;
    const winnerId = whiteId === disconnectedUserId ? blackId : whiteId;

    await cancelTimer(gameId);

    const abandonPayload = {
      type: WsMessageType.GAME_OVER,
      payload: { status: GameStatus.ABANDONED, reason: "abandoned", winnerId },
    };

    const uniqueIds = Array.from(new Set([winnerId, disconnectedUserId]));
    await Promise.all([
      ...uniqueIds.map((id) => sendToUser(id, abandonPayload)),
      broadcastGameUpdate(gameId, abandonPayload, uniqueIds),
    ]);

    await flushGameToDatabase(gameId, GameStatus.ABANDONED, winnerId);
  },
  { connection: redis },
);

reconnectWorker.on("failed", (job, err) => {
  console.error(`[Reconnect] Job ${job?.id} failed:`, err);
});

export async function startReconnectTimer(
  gameId: string,
  userId: string,
): Promise<void> {
  await reconnectQueue.add(
    "grace-period",
    { gameId, disconnectedUserId: userId },
    {
      jobId: Keys.reconnectJob(gameId, userId),
      delay: RECONNECT_GRACE_MS,
      removeOnComplete: true,
      removeOnFail: true,
    },
  );
}

export async function cancelReconnectTimer(
  gameId: string,
  userId: string,
): Promise<void> {
  const job = await reconnectQueue.getJob(Keys.reconnectJob(gameId, userId));
  if (job) {
    await job.remove();
  }
}

export async function handlePlayerAbandonment(
  gameId: string,
  disconnectedUserId: string,
) {
  const gameKey = Keys.game(gameId);
  const gameState = await redis.hgetall(gameKey);

  if (!gameState || Object.keys(gameState).length === 0) return;
  if (gameState.status !== GameStatus.IN_PROGRESS) return;

  const moveTimes = JSON.parse(gameState.moveTimes || "[]");

  if (moveTimes.length <= 2) {
    await flushGameToDatabase(gameId, GameStatus.ABANDONED);
  } else {
    const whiteUser = GameUserSchema.parse(JSON.parse(gameState.whiteUser));
    const blackUser = GameUserSchema.parse(JSON.parse(gameState.blackUser));
    const isWhite = whiteUser.id === disconnectedUserId;
    const winnerId = isWhite ? blackUser.id : whiteUser.id;
    const finalStatus = GameStatus.TIME_OUT;

    await flushGameToDatabase(gameId, finalStatus, winnerId);
  }
}
