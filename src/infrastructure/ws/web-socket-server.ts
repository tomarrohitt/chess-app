import type { Server, IncomingMessage } from "http";
import WebSocket, { WebSocketServer } from "ws";
import { randomBytes } from "crypto";
import type { Express } from "express";

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
  isAuthenticated: boolean;
  spectatingRooms?: Set<string>;
  chatRooms?: Set<string>;
}

// ── Ticket system ─────────────────────────────────────────────────────────────

const TICKET_TTL_SECONDS = 30;
const TICKET_PREFIX = "ws:ticket:";

async function generateWsTicket(userId: string): Promise<string> {
  const ticket = randomBytes(32).toString("hex");
  await redis.set(
    `${TICKET_PREFIX}${ticket}`,
    userId,
    "EX",
    TICKET_TTL_SECONDS,
  );
  return ticket;
}

async function resolveUserFromTicket(ticket: string): Promise<User> {
  const userId = await redis.get(`${TICKET_PREFIX}${ticket}`);

  if (!userId) {
    throw new AuthError("Invalid or expired ticket");
  }

  // One-time use — delete immediately after resolving
  await redis.del(`${TICKET_PREFIX}${ticket}`);

  const user = await db.query.user.findFirst({
    where: eq(userSchema.id, userId),
  });

  if (!user) {
    throw new AuthError("User not found");
  }

  return user;
}

export function registerWsTicketRoute(app: Express): void {
  app.get("/api/ws/ticket", async (req, res) => {
    try {
      // Request comes through Vercel proxy → same origin → cookies present
      const session = await auth.api.getSession({
        headers: req.headers as Record<string, string>,
      });

      if (!session?.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const ticket = await generateWsTicket(session.user.id);
      return res.json({ ticket });
    } catch (err) {
      console.error("[WS Ticket Error]", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}

// ── WebSocket server ──────────────────────────────────────────────────────────

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
      ws.spectatingRooms = new Set<string>();
      ws.chatRooms = new Set<string>();

      const authTimeout = setTimeout(() => {
        if (!ws.isAuthenticated) {
          console.warn("[WS] Auth timeout — closing socket.");
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
          if (parsed.type !== WsMessageType.AUTH || !parsed.payload?.ticket) {
            ws.send(
              JSON.stringify({ type: "ERROR", payload: "Not authenticated" }),
            );
            return;
          }

          try {
            const user = await resolveUserFromTicket(parsed.payload.ticket);
            await onAuthSuccess(user);
            ws.send(JSON.stringify({ type: WsMessageType.AUTH_SUCCESS }));
          } catch (err) {
            console.error("[WS] AUTH failed:", err);
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

        // Authenticated — route all messages normally
        routeMessage(ws, raw).catch((err) => {
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
