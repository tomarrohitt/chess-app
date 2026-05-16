import { useCallback, useEffect, useRef, useMemo } from "react";
import { DrawOffer, GameStatus, QueueStatus } from "../types/chess";
import { useGameStore } from "@/store/use-game-store";
import { User } from "@/types/auth";
import {
  ServerMessageSchema,
  WsConnectionStatus,
  WsMessageType,
} from "@/types/ws";
import { getTokenFromSession } from "@/actions/session";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";
const MAX_RECONNECT_ATTEMPTS = 10;
const MAX_QUEUE_SIZE = 50;
const HEARTBEAT_INTERVAL = 5000;

const HEARTBEAT_TIMEOUT = 3000;

export function useWebSocket(user: User) {
  const wsRef = useRef<WebSocket | null>(null);
  const messageQueue = useRef<string[]>([]);
  const userRef = useRef(user);
  const reconnectAttempts = useRef(0);
  const isIntentionalClose = useRef(false);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const action = useGameStore.getState().actions;
  const activeGame = useGameStore((s) => s.activeGame);
  const rematchOfferSent = useGameStore((s) => s.rematchOfferSent);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
    if (heartbeatTimeout.current) clearTimeout(heartbeatTimeout.current);
  }, []);

  const startHeartbeat = useCallback(
    (ws: WebSocket) => {
      clearHeartbeat();
      heartbeatInterval.current = setInterval(() => {
        if (ws.readyState !== WebSocket.OPEN) return;
        ws.send(JSON.stringify({ type: WsMessageType.PING }));

        heartbeatTimeout.current = setTimeout(() => {
          console.warn("[WS] Heartbeat timeout. Forcing reconnect...");

          const event = {
            code: 4000,
            reason: "Heartbeat timeout",
            wasClean: false,
          } as CloseEvent;
          if (ws.onclose) {
            ws.onclose(event);
            ws.onclose = null;
          }
          ws.close(4000, "Heartbeat timeout");
        }, HEARTBEAT_TIMEOUT);
      }, HEARTBEAT_INTERVAL);
    },
    [clearHeartbeat],
  );

  const send = useCallback((type: WsMessageType, payload?: unknown) => {
    const message: { type: WsMessageType; payload?: unknown } = { type };
    if (payload !== undefined && payload !== null) {
      message.payload = payload;
    }
    const rawMessage = JSON.stringify(message);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(rawMessage);
    } else {
      console.warn(`[WS] Socket not OPEN. Queuing message: ${type}`);
      if (messageQueue.current.length < MAX_QUEUE_SIZE) {
        messageQueue.current.push(rawMessage);
      } else {
        console.warn("[WS] Message queue full. Dropping:", type);
      }
    }
  }, []);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const raw = JSON.parse(event.data);
      try {
        const result = ServerMessageSchema.safeParse(raw);

        if (!result.success) {
          console.error(
            "[WS Client] Message validation failed! Raw:",
            raw,
            "Zod Errors:",
            result.error.format(),
          );
          return;
        }

        const msg = result.data;

        switch (msg.type) {
          case WsMessageType.MOVE_MADE:
            action.handleMoveMade(msg.payload);
            break;
          case WsMessageType.MOVE_REJECTED:
            action.handleMoveRejected(msg.payload.reason);
            break;
          case WsMessageType.GAME_STARTED:
            action.handleGameStarted(msg.payload);
            break;
          case WsMessageType.GAME_STATE:
            action.handleGameState(msg.payload);
            break;
          case WsMessageType.GAME_OVER:
            action.handleGameOver(msg.payload);
            break;
          case WsMessageType.QUEUE_JOINED:
            action.setQueue(msg.payload.status, msg.payload.timeControl);
            break;
          case WsMessageType.MATCHMAKING_TIMEOUT:
            action.setQueue(QueueStatus.IDLE);
            break;
          case WsMessageType.OFFER_DRAW:
            action.setDrawOffer(msg.payload);
            break;
          case WsMessageType.DECLINE_DRAW:
            action.setDrawOfferSent(DrawOffer.DECLINE);
            setTimeout(() => action.setDrawOfferSent(null), 5000);
            break;
          case WsMessageType.GAME_ABORTED:
            action.handleGameOver({
              status: GameStatus.ABANDONED,
              reason: msg.payload?.reason,
            });
            break;
          case WsMessageType.OFFER_REMATCH:
            action.setRematchOffer(msg.payload);
            break;
          case WsMessageType.DECLINE_REMATCH:
            action.setRematchOfferSent(DrawOffer.DECLINE);
            setTimeout(() => action.setRematchOfferSent(null), 5000);
            break;
          case WsMessageType.NEW_GAME_CHAT:
            action.addChatMessage(msg.payload);
            break;
          case WsMessageType.CHALLENGE_RECEIVED:
            action.setIncomingChallenge(msg.payload);
            break;
          case WsMessageType.RECEIVE_CHAT_MESSAGE:
          case WsMessageType.CHAT_MESSAGE_ACK:
            window.dispatchEvent(
              new CustomEvent("chat_message", { detail: msg.payload }),
            );
            break;
          case WsMessageType.PONG:
            if (heartbeatTimeout.current)
              clearTimeout(heartbeatTimeout.current);
            break;
          case WsMessageType.ERROR:
            console.error(msg.payload);
            break;
          case WsMessageType.QUEUE_LEFT:
          case WsMessageType.PLAYER_RECONNECTED:
          case WsMessageType.PLAYER_DISCONNECTED:
          case WsMessageType.CHALLENGE_DECLINED:
            break;
          default:
            console.warn(`[WS Client] Unhandled message type:`, msg.type);
        }
      } catch (err) {
        console.log("[WS] Failed to parse message:", err);
      }
    },
    [action],
  );

  const connect = useCallback(
    async function connectWebSocket() {
      isIntentionalClose.current = false;

      if (
        wsRef.current &&
        (wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }

      action.setConnection(WsConnectionStatus.CONNECTING);
      action.setUser(userRef.current);

      let wsUrl = WS_URL;
      try {
        const token = await getTokenFromSession();
        if (token) {
          const urlObj = new URL(wsUrl);
          urlObj.searchParams.set("token", token);
          wsUrl = urlObj.toString();
        }
      } catch (err) {
        console.error("[WS] Failed to get session token:", err);
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.warn("[WS] Connection timeout. Aborting...");
          const event = {
            code: 4008,
            reason: "Connection timeout",
            wasClean: false,
          } as CloseEvent;
          if (ws.onclose) {
            ws.onclose(event);
            ws.onclose = null;
          }
          ws.close();
        }
      }, 5000);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        action.setConnection(WsConnectionStatus.CONNECTED);
        startHeartbeat(ws);
        reconnectAttempts.current = 0;

        ws.send(JSON.stringify({ type: WsMessageType.SYNC_GAME }));

        while (messageQueue.current.length > 0) {
          const msg = messageQueue.current[0];
          try {
            ws.send(msg);
            messageQueue.current.shift();
          } catch (err) {
            console.error("[WS] Failed to drain queued message:", err);
            break;
          }
        }
      };

      ws.onmessage = handleMessage;

      ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error("[WS] Connection Error:", error);
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        clearHeartbeat();
        console.warn(
          `[WS] Closed. Code: ${event.code}, Reason: ${event.reason || "No reason given"}`,
        );
        action.setConnection(WsConnectionStatus.DISCONNECTED);
        wsRef.current = null;

        if (!isIntentionalClose.current) {
          if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
            console.error("[WS] Max reconnect attempts reached. Giving up.");
            action.setConnection(WsConnectionStatus.FAILED);
            return;
          }

          const baseDelay = 1000;
          const maxDelay = 30000;
          const exponentialDelay = Math.min(
            baseDelay * Math.pow(2, reconnectAttempts.current),
            maxDelay,
          );
          const jitter = exponentialDelay * 0.2 * Math.random();
          const finalDelay = Math.floor(exponentialDelay + jitter);

          reconnectAttempts.current++;

          reconnectTimeout.current = setTimeout(connectWebSocket, finalDelay);
        }
      };
    },
    [handleMessage, startHeartbeat, clearHeartbeat],
  );

  useEffect(() => {
    const handleOffline = () => {
      console.warn("[WS] Network offline detected.");
      isIntentionalClose.current = true;
      action.setConnection(WsConnectionStatus.DISCONNECTED);
      if (wsRef.current) {
        wsRef.current.close(1000, "Browser offline");
      }
    };

    const handleOnline = () => {
      isIntentionalClose.current = false;
      reconnectAttempts.current = 0;
      connect();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      isIntentionalClose.current = true;
      clearHeartbeat();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);

      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        wsRef.current.onmessage = null;
        wsRef.current.close(1000, "Component unmounted");
        wsRef.current = null;
        action.setConnection(WsConnectionStatus.DISCONNECTED);
      }
    };
  }, [connect, clearHeartbeat]);

  const api = useMemo(
    () => ({
      connect,
      joinQueue: (timeControl: string) =>
        send(WsMessageType.JOIN_QUEUE, { timeControl }),
      leaveQueue: () => {
        send(WsMessageType.LEAVE_QUEUE);
        action.setQueue(QueueStatus.IDLE);
      },
      makeMove: (
        gameId: string,
        from: string,
        to: string,
        promotion?: string,
      ) => send(WsMessageType.MAKE_MOVE, { gameId, from, to, promotion }),
      resign: (gameId: string) => send(WsMessageType.RESIGN_GAME, { gameId }),
      offerDraw: (gameId: string) => {
        send(WsMessageType.OFFER_DRAW, { gameId });
        action.setDrawOfferSent(DrawOffer.SENT);
      },
      acceptDraw: (gameId: string) => {
        send(WsMessageType.ACCEPT_DRAW, { gameId });
        action.setDrawOffer(null);
      },
      declineDraw: (gameId: string) => {
        send(WsMessageType.DECLINE_DRAW, { gameId });
        action.setDrawOffer(null);
      },
      offerRematch: (gameId: string, timeControl: string) => {
        send(WsMessageType.OFFER_REMATCH, { gameId, timeControl });
        action.setRematchOfferSent(DrawOffer.SENT);
        setTimeout(() => {
          if (rematchOfferSent === DrawOffer.SENT) {
            action.setRematchOfferSent(null);
          }
        }, 15000);
      },
      acceptRematch: (gameId: string, timeControl: string) => {
        send(WsMessageType.ACCEPT_REMATCH, { gameId, timeControl });
        action.setRematchOffer(null);
      },
      declineRematch: (gameId: string, timeControl: string) => {
        send(WsMessageType.DECLINE_REMATCH, { gameId, timeControl });
        action.setRematchOffer(null);
      },
      spectateGame: (gameId: string) => {
        const currentUser = userRef.current;

        if (
          activeGame?.gameId === gameId &&
          currentUser &&
          (activeGame.white.id === currentUser.id ||
            activeGame.black.id === currentUser.id)
        ) {
          return;
        }

        action.setExpectedGameId(gameId);
        send(WsMessageType.SPECTATE_GAME, { gameId });
      },
      leaveSpectator: (gameId: string) => {
        const action = useGameStore.getState();
        const activeGame = action.activeGame;
        const currentUser = userRef.current;

        if (
          activeGame?.gameId === gameId &&
          currentUser &&
          (activeGame.white.id === currentUser.id ||
            activeGame.black.id === currentUser.id)
        ) {
          return;
        }

        send(WsMessageType.LEAVE_SPECTATOR, { gameId });
      },
      sendChatMessage: (gameId: string, content: string) =>
        send(WsMessageType.SEND_GAME_CHAT, { gameId, content }),
      joinGameChat: (gameId: string) =>
        send(WsMessageType.JOIN_GAME_CHAT, { gameId }),
      leaveGameChat: (gameId: string) =>
        send(WsMessageType.LEAVE_GAME_CHAT, { gameId }),
      sendDirectMessage: (receiverId: string, content: string) =>
        send(WsMessageType.SEND_CHAT_MESSAGE, { receiverId, content }),
      markChatRead: (friendId: string) =>
        send(WsMessageType.MARK_CHAT_READ, { friendId }),
      markAllChatsRead: () => send(WsMessageType.MARK_ALL_CHATS_READ),
      offerChallenge: (targetId: string, timeControl: string) =>
        send(WsMessageType.OFFER_CHALLENGE, { targetId, timeControl }),
      acceptChallenge: (targetId: string, timeControl: string) =>
        send(WsMessageType.ACCEPT_CHALLENGE, { targetId, timeControl }),
      declineChallenge: (targetId: string) =>
        send(WsMessageType.DECLINE_CHALLENGE, { targetId }),
    }),
    [connect, send],
  );

  return api;
}
