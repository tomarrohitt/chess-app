import { eq } from "drizzle-orm";
import { db } from "../../infrastructure/db/db";
import { user } from "../../infrastructure/db/schema";
import { redis } from "../../infrastructure/redis/redis-client";
import {
  sendToUser,
  broadcastGameUpdate,
} from "../../infrastructure/ws/session-manager";
import { Keys } from "../../lib/keys";
import {
  GameStatus,
  WsMessageType,
  PlayerInfo,
  GameUserSchema,
  RematchOfferState,
} from "../../types/types";
import { cancelTimer } from "./timer";
import { flushGameToDatabase } from "./storage";
import { createNewMatch } from "../matchmaking/queue";

export async function verifyAndGetGameParticipants(
  gameId: string,
  userId: string,
) {
  const gameKey = Keys.game(gameId);
  const raw = await redis.hgetall(gameKey);
  if (!raw.whiteUser || !raw.blackUser) return null;

  const whiteUser = GameUserSchema.parse(JSON.parse(raw.whiteUser));
  const blackUser = GameUserSchema.parse(JSON.parse(raw.blackUser));
  if (userId !== whiteUser.id && blackUser.id !== userId) return null;

  return {
    gameKey,
    raw,
    whiteUser,
    blackUser,
    opponentId: userId === whiteUser.id ? blackUser.id : whiteUser.id,
  };
}

export async function handleAbort(gameId: string, userId: string) {
  const game = await verifyAndGetGameParticipants(gameId, userId);
  if (!game) return;

  const moveTimes = JSON.parse(game.raw.moveTimes || "[]");

  if (moveTimes.length > 2) {
    throw new Error(
      "Game cannot be aborted after 2 moves. Use Resign instead.",
    );
  }

  await Promise.all([
    redis.del(game.gameKey),
    redis.del(Keys.userActiveGame(game.whiteUser.id)),
    redis.del(Keys.userActiveGame(game.blackUser.id)),
    cancelTimer(gameId),
  ]);

  console.log(`[Game] Aborted | ID: ${gameId.slice(0, 8)}`);

  const payload = { type: WsMessageType.GAME_ABORTED, payload: { gameId } };
  const uniqueIds = Array.from(new Set([game.whiteUser.id, game.blackUser.id]));
  await Promise.all([
    ...uniqueIds.map((id) => sendToUser(id, payload)),
    broadcastGameUpdate(gameId, payload, uniqueIds),
  ]);
}

export async function handleDrawOffer(gameId: string, userId: string) {
  const game = await verifyAndGetGameParticipants(gameId, userId);
  if (!game) return;

  const drawKey = Keys.drawOffer(gameId);

  const existingOfferBy = await redis.get(drawKey);

  if (existingOfferBy) {
    return await sendToUser(userId, {
      type: WsMessageType.ERROR,
      payload: "A draw offer is already pending.",
    });
  }

  await redis.set(drawKey, userId, "EX", 20);

  await sendToUser(game.opponentId, {
    type: WsMessageType.OFFER_DRAW,
    payload: {
      gameId,
      offeredBy: userId,
      expiresAt: Date.now() + 20000,
    },
  });

  console.log(
    `[Game] Draw Offered | By: ${userId.slice(0, 5)}... to ${game.opponentId.slice(0, 5)}...`,
  );
}

export async function handleDrawAccept(gameId: string, userId: string) {
  const game = await verifyAndGetGameParticipants(gameId, userId);
  if (!game) return;

  const drawKey = Keys.drawOffer(gameId);
  const offeringUserId = await redis.get(drawKey);

  if (!offeringUserId || offeringUserId === userId) {
    throw new Error("No valid draw offer found to accept.");
  }

  const status = GameStatus.AGREEMENT;
  await flushGameToDatabase(gameId, status, undefined);

  const payload = {
    type: WsMessageType.GAME_OVER,
    payload: { status, reason: "agreement" },
  };

  const uniqueIds = Array.from(new Set([game.whiteUser.id, game.blackUser.id]));
  await Promise.all([
    ...uniqueIds.map((id) => sendToUser(id, payload)),
    broadcastGameUpdate(gameId, payload, uniqueIds),
    redis.del(drawKey),
  ]);

  console.log(`[Game] Draw Accepted | Agreement by both players`);
}

export async function handleDrawDecline(gameId: string, userId: string) {
  const game = await verifyAndGetGameParticipants(gameId, userId);
  if (!game) return;

  const drawKey = Keys.drawOffer(gameId);
  const offeringUserId = await redis.get(drawKey);

  if (!offeringUserId || offeringUserId === userId) return;

  await redis.del(drawKey);

  await sendToUser(offeringUserId, {
    type: WsMessageType.DECLINE_DRAW,
    payload: { gameId, message: "Your opponent declined the draw offer." },
  });

  console.log(`[Game] Draw Declined | ID: ${gameId.slice(0, 8)}`);
}

export async function handleRematchOffer(
  payload: { gameId: string; opponentId: string; timeControl: string },
  userId: string,
) {
  const { gameId, timeControl, opponentId } = payload;

  if (!opponentId) return;

  const rematchKey = `rematch:offer:${gameId}`;
  const existingOfferBy = await redis.get(rematchKey);

  if (existingOfferBy) {
    return await sendToUser(userId, {
      type: WsMessageType.ERROR,
      payload: "A rematch offer is already pending.",
    });
  }

  // Securely look up the offering user's PlayerInfo from DB
  const offeringUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { id: true, username: true, rating: true, image: true },
  });

  if (!offeringUser) return;

  const offerData = {
    offeredBy: userId,
    timeControl,
  };
  await redis.set(rematchKey, JSON.stringify(offerData), "EX", 60);

  await sendToUser(opponentId, {
    type: WsMessageType.OFFER_REMATCH,
    payload: {
      gameId,
      offeredBy: offeringUser,
      timeControl,
      expiresAt: Date.now() + 60000,
    },
  });

  console.log(
    `[Game] Rematch Offered | By: ${userId.slice(0, 5)}... to ${opponentId.slice(0, 5)}...`,
  );
}

export async function handleRematchAccept(
  payload: { gameId: string; opponentId: string; timeControl: string },
  userId: string,
) {
  const { gameId, timeControl, opponentId } = payload;

  if (!opponentId) return;

  const rematchKey = `rematch:offer:${gameId}`;
  const offerStr = await redis.get(rematchKey);
  if (!offerStr)
    return await sendToUser(userId, {
      type: WsMessageType.ERROR,
      payload: "No valid rematch offer found.",
    });

  const offerData = JSON.parse(offerStr);
  if (offerData.offeredBy === userId)
    return await sendToUser(userId, {
      type: WsMessageType.ERROR,
      payload: "You cannot accept your own offer.",
    });

  await redis.del(rematchKey);
  const [player1, player2] = await Promise.all([
    db.query.user.findFirst({ where: eq(user.id, userId) }),
    db.query.user.findFirst({ where: eq(user.id, opponentId) }),
  ]);

  if (!player1 || !player2)
    return await sendToUser(userId, {
      type: WsMessageType.ERROR,
      payload: "User data missing.",
    });

  await createNewMatch(
    player1 as any,
    player2 as any,
    offerData.timeControl || timeControl,
  );
  console.log(`[Game] Rematch Accepted`);
}

export async function handleRematchDecline(
  payload: { gameId: string; opponentId?: string; timeControl?: string },
  userId: string,
) {
  const { gameId } = payload;
  const rematchKey = `rematch:offer:${gameId}`;
  const offerStr = await redis.get(rematchKey);
  if (!offerStr) return;

  const offerData = JSON.parse(offerStr);
  if (offerData.offeredBy === userId) return;

  await redis.del(rematchKey);
  await sendToUser(offerData.offeredBy, {
    type: WsMessageType.DECLINE_REMATCH,
    payload: { gameId, message: "Declined" },
  });
}

export async function handleDrawExpire(gameId: string) {
  await redis.del(Keys.drawOffer(gameId));
}

export async function handleResign(gameId: string, userId: string) {
  const game = await verifyAndGetGameParticipants(gameId, userId);
  if (!game || (await redis.get(Keys.userActiveGame(userId))) !== gameId)
    return;

  const moveTimes = JSON.parse(game.raw.moveTimes || "[]");
  if (moveTimes.length < 2) return handleAbort(gameId, userId);

  await cancelTimer(gameId);
  const winnerId =
    game.whiteUser.id === userId ? game.blackUser.id : game.whiteUser.id;
  const status = GameStatus.RESIGN;

  await flushGameToDatabase(gameId, status, winnerId);
  const payload = {
    type: WsMessageType.GAME_OVER,
    payload: { status, winnerId, reason: "resignation" },
  };

  const uniqueIds = Array.from(new Set([game.whiteUser.id, game.blackUser.id]));
  await Promise.all([
    ...uniqueIds.map((id) => sendToUser(id, payload)),
    broadcastGameUpdate(gameId, payload, uniqueIds),
  ]);
}
