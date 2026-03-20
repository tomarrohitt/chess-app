import { parseGameState } from "../../lib/state";
import {
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
    const uniqueIds = Array.from(new Set([state.white.id, state.black.id]));
    await Promise.all([
      ...uniqueIds.map((id) => sendToUser(id, payload)),
      broadcastGameUpdate(gameId, payload, uniqueIds),
    ]);
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
    `[Move] ${userId.slice(0, 5)}: ${san} | Clocks W: ${Math.floor(whiteTime / 1000)}s, B: ${Math.floor(blackTime / 1000)}s`,
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
    const uniqueIds = Array.from(new Set([state.white.id, state.black.id]));
    await Promise.all([
      ...uniqueIds.map((id) => sendToUser(id, gameOverPayload)),
      broadcastGameUpdate(gameId, gameOverPayload, uniqueIds),
    ]);
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

    await startPlayerTimer(gameId, nextId, prevId, nextTime);
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

  const gameState = await redis.hgetall(Keys.game(gameId));
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
  };
}

export async function getSpectatorState(
  gameId: string,
): Promise<GameSyncState | null> {
  const gameState = await redis.hgetall(Keys.game(gameId));
  if (
    !gameState ||
    !gameState.whiteUser ||
    !gameState.blackUser ||
    !gameState.fen
  )
    return null;

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
    playerColor: PLAYER_COLOR.WHITE,
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
  };
}
