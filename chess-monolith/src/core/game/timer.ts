import { Queue, Worker } from "bullmq";
import { redis } from "../../infrastructure/redis/redis-client";
import { broadcastGameUpdate } from "../../infrastructure/ws/session-manager";
import { Keys } from "../../lib/keys";
import { GameStatus, WsMessageType } from "../../types/types";
import { flushGameToDatabase } from "./storage";

const TIMER_QUEUE_NAME = "game-timers";
const ABANDONMENT_QUEUE_NAME = "game-abandonment";
const DISCONNECT_GRACE_MS = 5000;

export const timerQueue = new Queue(TIMER_QUEUE_NAME, { connection: redis });

export const timerWorker = new Worker(
  TIMER_QUEUE_NAME,
  async (job) => {
    const { gameId, winnerId } = job.data as {
      gameId: string;
      winnerId: string;
    };
    const gameState = await redis.hgetall(Keys.game(gameId));

    if (!gameState || gameState.status !== GameStatus.IN_PROGRESS) return;

    const timeoutPayload = {
      type: WsMessageType.GAME_OVER,
      payload: { status: GameStatus.TIME_OUT, reason: "timeout", winnerId },
    };

    await Promise.all([
      broadcastGameUpdate(gameId, timeoutPayload),
      flushGameToDatabase(gameId, GameStatus.TIME_OUT, winnerId),
    ]);
  },
  { connection: redis },
);

export const abandonmentQueue = new Queue(ABANDONMENT_QUEUE_NAME, {
  connection: redis,
});

export const abandonmentWorker = new Worker(
  ABANDONMENT_QUEUE_NAME,
  async (job) => {
    const { gameId } = job.data as { gameId: string };
    const gameKey = Keys.game(gameId);
    const gameState = await redis.hgetall(gameKey);

    if (!gameState || gameState.status !== GameStatus.IN_PROGRESS) return;

    const whiteUser = JSON.parse(gameState.whiteUser);
    const blackUser = JSON.parse(gameState.blackUser);

    const moveTimes: number[] = JSON.parse(gameState.moveTimes || "[]");
    const isAbort = moveTimes.length < 2;
    const winnerId = isAbort
      ? undefined
      : gameState.whiteDisconnectedAt
        ? blackUser.id
        : whiteUser.id;

    const gameOverPayload = {
      type: WsMessageType.GAME_OVER,
      payload: { status: GameStatus.ABANDONED, winnerId, reason: "abandoned" },
    };

    await broadcastGameUpdate(gameId, gameOverPayload);
    await flushGameToDatabase(gameId, GameStatus.ABANDONED, winnerId);
  },
  { connection: redis },
);

export async function startPlayerTimer(
  gameId: string,
  opponentId: string,
  timeLeftMs: number,
) {
  const safeDelay = isNaN(timeLeftMs) ? 0 : Math.max(0, Math.floor(timeLeftMs));

  if (isNaN(timeLeftMs)) {
    console.error(
      `[Timer Critical] Received NaN for timeLeftMs in game ${gameId}. Opponent: ${opponentId}`,
    );
  }

  await timerQueue.add(
    "timeout",
    { gameId, winnerId: opponentId },
    {
      jobId: Keys.timerJob(gameId),
      delay: safeDelay,
      removeOnComplete: true,
      removeOnFail: true,
    },
  );
}
export async function cancelTimer(gameId: string) {
  const job = await timerQueue.getJob(Keys.timerJob(gameId));
  if (job) await job.remove();
}

export async function startReconnectTimer(gameId: string, userId: string) {
  const gameKey = Keys.game(gameId);
  const gameState = await redis.hgetall(gameKey);
  if (!gameState || !gameState.whiteUser) return;

  const whiteUser = JSON.parse(gameState.whiteUser);
  const color = whiteUser.id === userId ? "white" : "black";

  const isNewDisconnect = await redis.hsetnx(
    gameKey,
    `${color}DisconnectedAt`,
    Date.now(),
  );

  if (isNewDisconnect === 0) return;

  await broadcastGameUpdate(gameId, {
    type: "PLAYER_DISCONNECTED",
    payload: { color, userId },
  });

  await abandonmentQueue.add(
    "abandon-check",
    { gameId },
    {
      jobId: `abandonment_${gameId}`,
      delay: DISCONNECT_GRACE_MS,
      removeOnComplete: true,
      removeOnFail: true,
    },
  );
}

export async function cancelReconnectTimer(gameId: string, userId: string) {
  const gameKey = Keys.game(gameId);
  const gameState = await redis.hgetall(gameKey);
  if (!gameState || !gameState.whiteUser) return;

  const whiteUser = JSON.parse(gameState.whiteUser);
  const color = whiteUser.id === userId ? "white" : "black";

  const deletedCount = await redis.hdel(gameKey, `${color}DisconnectedAt`);

  if (deletedCount === 0) return;

  await broadcastGameUpdate(gameId, {
    type: "PLAYER_RECONNECTED",
    payload: { color, userId },
  });

  const job = await abandonmentQueue.getJob(`abandonment_${gameId}`);
  if (job) await job.remove();
}

export async function cancelAbandonmentJob(gameId: string): Promise<void> {
  const jobId = `abandonment_${gameId}`;
  const job = await abandonmentQueue.getJob(jobId);

  if (job) {
    try {
      const isActive = await job.isActive();

      if (!isActive) {
        await job.remove();
      }
    } catch (err) {
      console.warn(
        `[Timer] Could not remove locked job ${jobId}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }
}
