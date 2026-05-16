import type { Server, IncomingMessage } from "http";
import WebSocket, { WebSocketServer } from "ws";

import { routeMessage } from "./message-router";
import {
  registerSession,
  unregisterSession,
  subscribeToGameUpdates,
  unsubscribeFromGameUpdates,
  leaveGameChatRoom,
  getActiveSessions,
} from "./session-manager";
import {
  startReconnectTimer,
  cancelReconnectTimer,
} from "../../core/game/timer";
import { redis } from "../redis/redis-client";
import { Keys } from "../../lib/keys";
import { AuthError } from "../../lib/errors";
import { auth } from "../../lib/auth";
import { getSyncState } from "../../core/game/engine";
import { PlayerInfo, WsMessageType } from "../../types/types";
import { handleLeaveQueue } from "../../core/matchmaking/queue";
import { db } from "../db/db";
import { user as userSchema } from "../db/schema";
import { eq, InferSelectModel } from "drizzle-orm";

type User = InferSelectModel<typeof userSchema>;

export interface AuthenticatedWebSocket extends WebSocket {
  user: PlayerInfo;
  isAlive: boolean;
  spectatingRooms?: Set<string>;
  chatRooms?: Set<string>;
}

async function extractUser(req: IncomingMessage): Promise<User> {
  try {
    // 1. Shallow copy existing headers
    const headers = { ...req.headers } as Record<string, string>;

    // 2. Extract the token from the URL query parameters
    const fallbackHost = req.headers.host || "localhost:7860";
    const parsedUrl = new URL(req.url || "", `http://${fallbackHost}`);
    const token = parsedUrl.searchParams.get("token");

    if (token) {
      // 3. Reconstruct the cookie headers manually.
      // We supply both the standard and production secure cookie names
      // to guarantee Better Auth catches it regardless of environment configuration.
      headers["cookie"] =
        `better-auth.session-token=${token}; __Secure-better-auth.session-token=${token}`;
    }

    // 4. Fire the session validation with the mocked cookie headers
    const session = await auth.api.getSession({
      headers: headers,
    });

    if (!session || !session.user) {
      throw new AuthError("Invalid or expired session");
    }

    const user = await db.query.user.findFirst({
      where: eq(userSchema.id, session.user.id),
    });

    if (!user) {
      throw new AuthError("User not found");
    }

    return user;
  } catch (err) {
    if (err instanceof AuthError) throw err;
    console.error("[WS Auth Error]", err);
    throw new AuthError("Authentication failed");
  }
}

export function initializeWebSocketServer(server: Server): void {
  const wss = new WebSocketServer({ server });

  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((client) => {
      const ws = client as AuthenticatedWebSocket;
      if (!ws.isAlive) {
        ws.terminate();
        return;
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30_000);

  wss.on("close", () => clearInterval(heartbeatInterval));

  wss.on("connection", async (ws: AuthenticatedWebSocket, req) => {
    ws.isAlive = true;
    ws.spectatingRooms = new Set<string>();
    ws.chatRooms = new Set<string>();
    let user: User;

    try {
      user = await extractUser(req);
    } catch (err: unknown) {
      const msg = err instanceof AuthError ? err.userMessage : err;
      ws.send(JSON.stringify({ type: "ERROR", payload: msg }));
      ws.close(1008, "Unauthorized");
      return;
    }

    ws.user = {
      id: user.id,
      username: user.username,
      image: user.image,
      rating: user.rating,
    };

    await registerSession(user.id, ws);

    const activeGameId = await redis.get(Keys.userActiveGame(user.id));
    if (activeGameId) {
      await cancelReconnectTimer(activeGameId, user.id);
    }

    try {
      const initialState = await getSyncState(user.id);
      if (initialState) {
        subscribeToGameUpdates(initialState.gameId, ws);
        ws.send(
          JSON.stringify({
            type: WsMessageType.GAME_STATE,
            payload: initialState,
          }),
        );
      }
    } catch (err) {
      console.error(`[Sync Error] Failed to fetch state for ${user.id}:`, err);
    }

    ws.on("message", (message: Buffer) => {
      routeMessage(ws, message.toString()).catch((err) => {
        console.error("[Fatal Router Error]", err);
      });
    });

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("close", async () => {
      await unregisterSession(user.id, ws);

      if (ws.spectatingRooms) {
        for (const gameId of ws.spectatingRooms) {
          unsubscribeFromGameUpdates(gameId, ws);
        }
      }

      if (ws.chatRooms) {
        for (const gameId of ws.chatRooms) {
          leaveGameChatRoom(gameId, ws);
        }
      }

      const otherSessions = await getActiveSessions(user.id);
      if (otherSessions.length === 0) {
        await handleLeaveQueue(user.id).catch(console.error);
        const gameId = await redis.get(Keys.userActiveGame(user.id));
        if (gameId) {
          await startReconnectTimer(gameId, user.id);
        }
      }
    });

    ws.on("error", (err) => {
      console.error(`[WS Error] User ${user.id}:`, err);
    });
  });
}
