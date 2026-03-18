import { v7 as uuidv7 } from "uuid";
import { redis } from "../../infrastructure/redis/redis-client";
import { Keys } from "../../lib/keys";
import type { AuthenticatedWebSocket } from "./web-socket-server";

const localSessions = new Map<string, AuthenticatedWebSocket>();
const spectatorRooms = new Map<string, Set<AuthenticatedWebSocket>>();

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

      const ws = localSessions.get(userId);
      if (ws?.readyState === 1) {
        ws.send(payload);
      }
    } else if (channel.startsWith("game:updates:")) {
      const gameId = channel.replace("game:updates:", "");
      const room = spectatorRooms.get(gameId);
      if (room) {
        const parsed = JSON.parse(raw);
        let messageStr = raw;
        let excludeSet = new Set<string>();

        // Support for new broadcast format containing exclude lists
        if (
          parsed &&
          typeof parsed === "object" &&
          "message" in parsed &&
          Array.isArray(parsed.excludeUserIds)
        ) {
          messageStr = JSON.stringify(parsed.message);
          excludeSet = new Set(parsed.excludeUserIds);
        }

        for (const ws of room) {
          if (ws.readyState === 1) {
            if (excludeSet.has(ws.userId)) continue;
            ws.send(messageStr);
          } else {
            room.delete(ws); // Auto clean up stale sockets
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
  localSessions.set(userId, ws);

  await redis.set(Keys.session(userId), INSTANCE_ID, "EX", 86_400);
}

export async function unregisterSession(userId: string): Promise<void> {
  localSessions.delete(userId);
  await redis.del(Keys.session(userId));
}

export async function sendToUser(
  userId: string,
  message: unknown,
): Promise<void> {
  const payload = JSON.stringify(message);

  const ws = localSessions.get(userId);
  if (ws?.readyState === 1) {
    ws.send(payload);
    return;
  }

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
  excludeUserIds: string[] = [],
): Promise<void> {
  await redis.publish(
    `game:updates:${gameId}`,
    JSON.stringify({ message, excludeUserIds }),
  );
}

export function joinSpectatorRoom(gameId: string, ws: AuthenticatedWebSocket) {
  let room = spectatorRooms.get(gameId);
  if (!room) {
    room = new Set();
    spectatorRooms.set(gameId, room);
    subscriber.subscribe(`game:updates:${gameId}`).catch(console.error);
  }
  room.add(ws);
  if (ws.spectatingRooms) ws.spectatingRooms.add(gameId);
}

export function leaveSpectatorRoom(gameId: string, ws: AuthenticatedWebSocket) {
  const room = spectatorRooms.get(gameId);
  if (room) {
    room.delete(ws);
    if (room.size === 0) {
      spectatorRooms.delete(gameId);
      subscriber.unsubscribe(`game:updates:${gameId}`).catch(console.error);
    }
  }
  if (ws.spectatingRooms) ws.spectatingRooms.delete(gameId);
}
