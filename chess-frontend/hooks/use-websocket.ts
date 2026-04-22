import { useCallback, useEffect, useRef, useMemo } from "react";
import { DrawOffer, GameStatus, QueueStatus } from "../types/chess";
import { useGameStore } from "@/store/use-game-store";
import { User } from "@/types/auth";
import {
  ServerMessageSchema,
  WsConnectionStatus,
  WsMessageType,
} from "@/types/ws";

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
          // Manually fire the close event because ws.close() hangs on dead networks
          const event = {
            code: 4000,
            reason: "Heartbeat timeout",
            wasClean: false,
          } as CloseEvent;
          if (ws.onclose) {
            ws.onclose(event);
            ws.onclose = null; // Prevent it from double-firing later
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

  const handleMessage = useCallback((event: MessageEvent) => {
    const raw = JSON.parse(event.data);
    try {
      const result = ServerMessageSchema.safeParse(raw);

      if (!result.success) {
        return;
      }

      const msg = result.data;

      const store = useGameStore.getState();
      switch (msg.type) {
        case WsMessageType.MOVE_MADE:
          store.handleMoveMade(msg.payload);
          break;
        case WsMessageType.MOVE_REJECTED:
          store.handleMoveRejected(msg.payload.reason);
          break;
        case WsMessageType.GAME_STARTED:
          store.handleGameStarted(msg.payload);
          break;
        case WsMessageType.GAME_STATE:
          store.handleGameState(msg.payload);
          break;
        case WsMessageType.GAME_OVER:
          store.handleGameOver(msg.payload);
          break;
        case WsMessageType.QUEUE_JOINED:
          store.setQueue(msg.payload.status, msg.payload.timeControl);
          break;
        case WsMessageType.MATCHMAKING_TIMEOUT:
          store.setQueue(QueueStatus.IDLE);
          break;
        case WsMessageType.OFFER_DRAW:
          store.setDrawOffer(msg.payload);
          break;
        case WsMessageType.DECLINE_DRAW:
          store.setDrawOfferSent(DrawOffer.DECLINE);
          setTimeout(() => store.setDrawOfferSent(null), 5000);
          break;
        case WsMessageType.GAME_ABORTED:
          store.handleGameOver({
            status: GameStatus.ABANDONED,
            reason: msg.payload?.reason,
          });
          break;
        case WsMessageType.OFFER_REMATCH:
          store.setRematchOffer(msg.payload);
          break;
        case WsMessageType.DECLINE_REMATCH:
          store.setRematchOfferSent(DrawOffer.DECLINE);
          setTimeout(() => store.setRematchOfferSent(null), 5000);
          break;
        case WsMessageType.NEW_GAME_CHAT:
          store.addChatMessage(msg.payload);
          break;
        case WsMessageType.CHALLENGE_RECEIVED:
          store.setIncomingChallenge(msg.payload);
          break;
        case WsMessageType.RECEIVE_CHAT_MESSAGE:
        case WsMessageType.CHAT_MESSAGE_ACK:
          window.dispatchEvent(
            new CustomEvent("chat_message", { detail: msg.payload }),
          );
          break;
        case WsMessageType.PONG:
          if (heartbeatTimeout.current) clearTimeout(heartbeatTimeout.current);
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
          console.warn(`[WS] Unhandled message type: ${msg.type}`);
      }
    } catch (err) {
      console.log("[WS] Failed to parse message:", err);
    }
  }, []);

  const connect = useCallback(
    function connectWebSocket() {
      isIntentionalClose.current = false;
      const store = useGameStore.getState();

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

      console.log("[WS] Attempting to connect to:", WS_URL);
      store.setConnection(WsConnectionStatus.CONNECTING);
      store.setUser(userRef.current);

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      // Connection timeout to prevent hanging in "CONNECTING" state
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
      }, 5000); // 5 seconds to connect before we try backing off again

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        store.setConnection(WsConnectionStatus.CONNECTED);
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
        store.setConnection(WsConnectionStatus.DISCONNECTED);
        wsRef.current = null;

        if (!isIntentionalClose.current) {
          if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
            console.error("[WS] Max reconnect attempts reached. Giving up.");
            store.setConnection(WsConnectionStatus.FAILED);
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
          console.log(
            `[WS] Reconnecting in ${finalDelay}ms (Attempt ${reconnectAttempts.current})...`,
          );
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
      useGameStore.getState().setConnection(WsConnectionStatus.DISCONNECTED);
      if (wsRef.current) {
        wsRef.current.close(1000, "Browser offline");
      }
    };

    const handleOnline = () => {
      console.log("[WS] Network online. Reconnecting...");
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
      clearHeartbeat(); // ← added: onclose won't run since we null it below
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);

      if (wsRef.current) {
        console.log("[WS] Component unmounted, closing socket.");
        wsRef.current.onopen = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        wsRef.current.onmessage = null;
        wsRef.current.close(1000, "Component unmounted");
        wsRef.current = null;
        useGameStore.getState().setConnection(WsConnectionStatus.DISCONNECTED);
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
        useGameStore.getState().setQueue(QueueStatus.IDLE);
      },
      makeMove: (
        gameId: string,
        from: string,
        to: string,
        promotion?: string,
      ) => send(WsMessageType.MAKE_MOVE, { gameId, from, to, promotion }),
      resign: (gameId: string) => send(WsMessageType.RESIGN_GAME, { gameId }),
      offerDraw: (gameId: string) => {
        const store = useGameStore.getState();
        send(WsMessageType.OFFER_DRAW, { gameId });
        store.setDrawOfferSent(DrawOffer.SENT);
      },
      acceptDraw: (gameId: string) => {
        send(WsMessageType.ACCEPT_DRAW, { gameId });
        useGameStore.getState().setDrawOffer(null);
      },
      declineDraw: (gameId: string) => {
        send(WsMessageType.DECLINE_DRAW, { gameId });
        useGameStore.getState().setDrawOffer(null);
      },
      offerRematch: (gameId: string, timeControl: string) => {
        const store = useGameStore.getState();
        send(WsMessageType.OFFER_REMATCH, { gameId, timeControl });
        store.setRematchOfferSent(DrawOffer.SENT);
        setTimeout(() => {
          if (useGameStore.getState().rematchOfferSent === DrawOffer.SENT) {
            store.setRematchOfferSent(null);
          }
        }, 15000);
      },
      acceptRematch: (gameId: string, timeControl: string) => {
        send(WsMessageType.ACCEPT_REMATCH, { gameId, timeControl });
        useGameStore.getState().setRematchOffer(null);
      },
      declineRematch: (gameId: string, timeControl: string) => {
        send(WsMessageType.DECLINE_REMATCH, { gameId, timeControl });
        useGameStore.getState().setRematchOffer(null);
      },
      spectateGame: (gameId: string) => {
        const store = useGameStore.getState();
        const activeGame = store.activeGame;
        const currentUser = userRef.current;

        if (
          activeGame?.gameId === gameId &&
          currentUser &&
          (activeGame.white.id === currentUser.id ||
            activeGame.black.id === currentUser.id)
        ) {
          return;
        }

        store.setExpectedGameId(gameId);
        send(WsMessageType.SPECTATE_GAME, { gameId });
      },
      leaveSpectator: (gameId: string) => {
        const store = useGameStore.getState();
        const activeGame = store.activeGame;
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
