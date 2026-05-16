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
import { db } from "../db/db";
import { session as sessionSchema, user as userSchema } from "../db/schema";
import { eq, and, gt, InferSelectModel } from "drizzle-orm";
import { getSyncState } from "../../core/game/engine";
import { PlayerInfo, WsMessageType } from "../../types/types";
import { handleLeaveQueue } from "../../core/matchmaking/queue";

type User = InferSelectModel<typeof userSchema>;

export interface AuthenticatedWebSocket extends WebSocket {
  user?: PlayerInfo;
  isAlive: boolean;
  isAuthenticated: boolean;
  spectatingRooms?: Set<string>;
  chatRooms?: Set<string>;
}

export interface FullyAuthenticatedWebSocket extends AuthenticatedWebSocket {
  user: PlayerInfo;
}

async function resolveUserFromToken(token: string): Promise<User> {
  const sessionRecord = await db.query.session.findFirst({
    where: and(
      eq(sessionSchema.token, token),
      gt(sessionSchema.expiresAt, new Date()),
    ),
  });

  if (!sessionRecord) {
    throw new Error("Invalid or expired session token");
  }

  const user = await db.query.user.findFirst({
    where: eq(userSchema.id, sessionRecord.userId),
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

function extractTokenFromUrl(req: IncomingMessage): string | null {
  const fallbackHost = req.headers.host || "localhost:7860";
  const parsedUrl = new URL(req.url || "", `http://${fallbackHost}`);
  return parsedUrl.searchParams.get("token");
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

  wss.on(
    "connection",
    async (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
      ws.isAlive = true;
      ws.isAuthenticated = false;
      ws.spectatingRooms = new Set();
      ws.chatRooms = new Set();

      // Kick unauthenticated sockets after 10 seconds
      const authTimeout = setTimeout(() => {
        if (!ws.isAuthenticated) {
          console.warn("[WS] Auth timeout. Closing unauthenticated socket.");
          ws.send(
            JSON.stringify({
              type: "ERROR",
              payload: "Authentication timeout",
            }),
          );
          ws.close(1008, "Authentication timeout");
        }
      }, 10_000);

      async function onAuthSuccess(user: User) {
        if (ws.isAuthenticated) return; // guard against double-auth (URL token + AUTH message both succeed)

        clearTimeout(authTimeout);
        ws.isAuthenticated = true;

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
          console.error(
            `[Sync Error] Failed to fetch state for ${user.id}:`,
            err,
          );
        }
      }

      // Layer 1: Try URL token immediately during handshake
      const urlToken = extractTokenFromUrl(req);
      if (urlToken) {
        try {
          const user = await resolveUserFromToken(urlToken);
          await onAuthSuccess(user);
        } catch (err) {
          console.warn(
            "[WS] URL token auth failed, waiting for AUTH message:",
            err,
          );
        }
      }

      ws.on("message", async (message: Buffer) => {
        const raw = message.toString();
        let parsed: { type: string; payload?: any };

        try {
          parsed = JSON.parse(raw);
        } catch {
          console.warn("[WS] Received non-JSON message. Ignoring.");
          return;
        }

        if (!ws.isAuthenticated) {
          if (parsed.type !== "AUTH" || !parsed.payload?.token) {
            ws.send(
              JSON.stringify({ type: "ERROR", payload: "Not authenticated" }),
            );
            return;
          }

          try {
            const user = await resolveUserFromToken(parsed.payload.token);
            await onAuthSuccess(user);
            ws.send(JSON.stringify({ type: "AUTH_SUCCESS" }));
          } catch (err) {
            console.error("[WS] AUTH message failed:", err);
            ws.send(
              JSON.stringify({
                type: "ERROR",
                payload: "Authentication failed",
              }),
            );
            ws.close(1008, "Unauthorized");
          }
          return;
        }

        // Already authenticated — handle AUTH message sent redundantly (URL token succeeded first)
        if (parsed.type === "AUTH") {
          ws.send(JSON.stringify({ type: "AUTH_SUCCESS" }));
          return;
        }

        // Route all other messages normally
        routeMessage(ws as FullyAuthenticatedWebSocket, raw).catch((err) => {
          console.error("[Fatal Router Error]", err);
        });
      });

      ws.on("pong", () => {
        ws.isAlive = true;
      });

      ws.on("close", async () => {
        clearTimeout(authTimeout);
        if (!ws.isAuthenticated || !ws.user) return;

        const userId = ws.user.id;
        await unregisterSession(userId, ws);

        for (const gameId of ws.spectatingRooms ?? []) {
          unsubscribeFromGameUpdates(gameId, ws);
        }
        for (const gameId of ws.chatRooms ?? []) {
          leaveGameChatRoom(gameId, ws);
        }

        const otherSessions = await getActiveSessions(userId);
        if (otherSessions.length === 0) {
          await handleLeaveQueue(userId).catch(console.error);
          const gameId = await redis.get(Keys.userActiveGame(userId));
          if (gameId) {
            await startReconnectTimer(gameId, userId);
          }
        }
      });

      ws.on("error", (err) => {
        console.error(
          `[WS Error] User ${ws.user?.id ?? "unauthenticated"}:`,
          err,
        );
      });
    },
  );
}
