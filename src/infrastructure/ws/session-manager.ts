import { v7 as uuidv7 } from "uuid";
import { redis } from "../../infrastructure/redis/redis-client";
import { Keys } from "../../lib/keys";
import type { AuthenticatedWebSocket } from "./web-socket-server";
import { WsMessageType } from "../../types/types";

const localSessions = new Map<string, Set<AuthenticatedWebSocket>>();
const gameUpdateRooms = new Map<string, Set<AuthenticatedWebSocket>>();
const gameChatRooms = new Map<string, Set<AuthenticatedWebSocket>>();

export const INSTANCE_ID = uuidv7();

const subscriber = redis.duplicate();

subscriber.subscribe(`ws:instance:${INSTANCE_ID}`, (err) => {
  if (err) {
    console.error("[Sessions] Failed to subscribe to instance channel:", err);
  }
});

subscriber.on("message", (channel: string, raw: string) => {
  try {
    if (channel === `ws:instance:${INSTANCE_ID}`) {
      const { userId, payload } = JSON.parse(raw) as {
        userId: string;
        payload: string;
      };

      const session = localSessions.get(userId);
      if (session) {
        try {
          const message = JSON.parse(payload);
          if (message.type === WsMessageType.GAME_STARTED) {
            const gameId = message.payload?.gameId;
            if (gameId) {
              for (const ws of session) {
                subscribeToGameUpdates(gameId, ws);
              }
            }
          }
        } catch (e) {
          // Ignore parse errors here; payload might be a plain string
        }

        for (const ws of session) {
          if (ws.readyState === 1) {
            ws.send(payload);
          }
        }
      }
    } else if (channel.startsWith("game:updates:")) {
      const gameId = channel.replace("game:updates:", "");
      const room = gameUpdateRooms.get(gameId);
      if (room) {
        for (const ws of room) {
          if (ws.readyState === 1) {
            ws.send(raw);
          } else {
            room.delete(ws);
          }
        }
      }
    } else if (channel.startsWith("chat:room:")) {
      const gameId = channel.replace("chat:room:", "");
      const room = gameChatRooms.get(gameId);
      if (room) {
        for (const ws of room) {
          if (ws.readyState === 1) {
            ws.send(raw);
          } else {
            room.delete(ws);
          }
        }
      }
    }
  } catch (err) {
    console.error("[Sessions] Failed to process pub/sub message:", err);
  }
});

export async function registerSession(
  userId: string,
  ws: AuthenticatedWebSocket,
): Promise<void> {
  let session = localSessions.get(userId);
  if (!session) {
    session = new Set();
    localSessions.set(userId, session);
  }
  session.add(ws);

  await redis.set(Keys.session(userId), INSTANCE_ID, "EX", 86_400);
}

export async function unregisterSession(
  userId: string,
  ws: AuthenticatedWebSocket,
): Promise<void> {
  const session = localSessions.get(userId);
  if (session) {
    session.delete(ws);
    if (session.size === 0) {
      localSessions.delete(userId);
      await redis.del(Keys.session(userId));
    }
  }
}

export async function getActiveSessions(
  userId: string,
): Promise<AuthenticatedWebSocket[]> {
  const sessions = localSessions.get(userId);
  return sessions ? Array.from(sessions) : [];
}

export async function sendToUser(
  userId: string,
  message: unknown,
): Promise<void> {
  const payload = JSON.stringify(message);

  const session = localSessions.get(userId);
  let sent = false;
  if (session && session.size > 0) {
    const msg = message as { type: WsMessageType; payload: any };
    if (msg.type === WsMessageType.GAME_STARTED) {
      const gameId = msg.payload.gameId;
      if (gameId) {
        for (const ws of session) {
          subscribeToGameUpdates(gameId, ws);
        }
      }
    }

    for (const ws of session) {
      if (ws.readyState === 1) {
        ws.send(payload);
        sent = true;
      }
    }
  }

  if (sent) return;

  const instanceId = await redis.get(Keys.session(userId));
  if (instanceId) {
    await redis.publish(
      `ws:instance:${instanceId}`,
      JSON.stringify({ userId, payload }),
    );
  } else {
    console.warn(`[Sessions] User ${userId} is offline — message dropped`);
  }
}

export async function broadcastGameUpdate(
  gameId: string,
  message: unknown,
): Promise<void> {
  await redis.publish(`game:updates:${gameId}`, JSON.stringify(message));
}

export function subscribeToGameUpdates(
  gameId: string,
  ws: AuthenticatedWebSocket,
) {
  let room = gameUpdateRooms.get(gameId);
  if (!room) {
    room = new Set();
    gameUpdateRooms.set(gameId, room);
    subscriber.subscribe(`game:updates:${gameId}`).catch(console.error);
  }
  room.add(ws);
  if (!ws.spectatingRooms) ws.spectatingRooms = new Set();
  ws.spectatingRooms.add(gameId);
}

export function unsubscribeFromGameUpdates(
  gameId: string,
  ws: AuthenticatedWebSocket,
) {
  const room = gameUpdateRooms.get(gameId);
  if (room) {
    room.delete(ws);
    if (room.size === 0) {
      gameUpdateRooms.delete(gameId);
      subscriber.unsubscribe(`game:updates:${gameId}`).catch(console.error);
    }
  }
  if (ws.spectatingRooms) ws.spectatingRooms.delete(gameId);
}

export function joinGameChatRoom(gameId: string, ws: AuthenticatedWebSocket) {
  let room = gameChatRooms.get(gameId);
  if (!room) {
    room = new Set();
    gameChatRooms.set(gameId, room);
    subscriber.subscribe(`chat:room:${gameId}`).catch(console.error);
  }
  room.add(ws);
  if (!ws.chatRooms) ws.chatRooms = new Set();
  ws.chatRooms.add(gameId);
}

export function leaveGameChatRoom(gameId: string, ws: AuthenticatedWebSocket) {
  const room = gameChatRooms.get(gameId);
  if (room) {
    room.delete(ws);
    if (room.size === 0) {
      gameChatRooms.delete(gameId);
      subscriber.unsubscribe(`chat:room:${gameId}`).catch(console.error);
    }
  }
  if (ws.chatRooms) ws.chatRooms.delete(gameId);
}

export async function broadcastGameChat(
  gameId: string,
  message: unknown,
): Promise<void> {
  await redis.publish(`chat:room:${gameId}`, JSON.stringify(message));
}
