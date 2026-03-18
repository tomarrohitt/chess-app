import { useCallback, useEffect, useRef, useMemo } from "react";
import {
  WsMessageType,
  GameStatus,
  WS_CONNECTION_STATUS,
  ServerMessageSchema,
  DRAW_OFFER,
  QUEUE_STATUS,
} from "../types/chess";
import { useGameStore } from "@/store/use-game-store";
import { User } from "@/types/auth";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";

export function useWebSocket(user: User) {
  const wsRef = useRef<WebSocket | null>(null);
  const messageQueue = useRef<string[]>([]);
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const send = useCallback((type: WsMessageType, payload?: any) => {
    const message: { type: WsMessageType; payload?: any } = { type };
    if (payload !== undefined && payload !== null) {
      message.payload = payload;
    }
    const rawMessage = JSON.stringify(message);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(rawMessage);
    } else {
      console.warn(`[WS] Socket not OPEN. Queuing message: ${type}`);
      messageQueue.current.push(rawMessage);
    }
  }, []);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const raw = JSON.parse(event.data);
      const msg = ServerMessageSchema.parse(raw);
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
        case WsMessageType.QUEUE_LEFT:
        case WsMessageType.MATCHMAKING_TIMEOUT:
          store.setQueue(QUEUE_STATUS.IDLE);
          break;
        case WsMessageType.OFFER_DRAW:
          store.setDrawOffer(msg.payload);
          break;
        case WsMessageType.DECLINE_DRAW:
          store.setDrawOfferSent(DRAW_OFFER.DECLINE);
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
          store.setRematchOfferSent(DRAW_OFFER.DECLINE);
          setTimeout(() => store.setRematchOfferSent(null), 5000);
          break;
      }
    } catch (err) {
      console.error("[WS] Failed to parse message:", err);
    }
  }, []);

  const connect = useCallback(() => {
    const store = useGameStore.getState();

    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    console.log("[WS] Attempting to connect to:", WS_URL);
    store.setConnection(WS_CONNECTION_STATUS.CONNECTING);
    store.setUser(userRef.current);

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WS] Connected, requesting sync...");
      store.setConnection(WS_CONNECTION_STATUS.CONNECTED);

      ws.send(JSON.stringify({ type: WsMessageType.SYNC_GAME }));

      while (messageQueue.current.length > 0) {
        const msg = messageQueue.current.shift();
        if (msg) ws.send(msg);
      }
    };

    ws.onmessage = handleMessage;

    ws.onerror = (error) => {
      console.error("[WS] Connection Error:", error);
      store.setConnection(WS_CONNECTION_STATUS.DISCONNECTED);
    };

    ws.onclose = (event) => {
      console.warn(
        `[WS] Closed. Code: ${event.code}, Reason: ${event.reason || "No reason given"}`,
      );
      store.setConnection(WS_CONNECTION_STATUS.DISCONNECTED);
      wsRef.current = null;
    };
  }, [handleMessage]);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        console.log("[WS] Component unmounted, closing socket.");
        wsRef.current.close(1000, "Component unmounted");
        wsRef.current = null;
      }
    };
  }, []);

  const api = useMemo(
    () => ({
      connect,
      joinQueue: (timeControl: string) =>
        send(WsMessageType.JOIN_QUEUE, { timeControl }),
      leaveQueue: () => {
        send(WsMessageType.LEAVE_QUEUE);
        useGameStore.getState().setQueue(QUEUE_STATUS.IDLE);
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
        store.setDrawOfferSent(DRAW_OFFER.SENT);
        setTimeout(() => {
          if (useGameStore.getState().drawOfferSent === DRAW_OFFER.SENT) {
            store.setDrawOfferSent(null);
          }
        }, 20000);
      },
      acceptDraw: (gameId: string) => {
        send(WsMessageType.ACCEPT_DRAW, { gameId });
        useGameStore.getState().setDrawOffer(null);
      },
      declineDraw: (gameId: string) => {
        send(WsMessageType.DECLINE_DRAW, { gameId });
        useGameStore.getState().setDrawOffer(null);
      },
      offerRematch: (
        gameId: string,
        opponentId: string,
        timeControl: string,
      ) => {
        const store = useGameStore.getState();
        send(WsMessageType.OFFER_REMATCH, { gameId, opponentId, timeControl });
        store.setRematchOfferSent(DRAW_OFFER.SENT);
        setTimeout(() => {
          if (useGameStore.getState().rematchOfferSent === DRAW_OFFER.SENT) {
            store.setRematchOfferSent(null);
          }
        }, 60000);
      },
      acceptRematch: (
        gameId: string,
        opponentId: string,
        timeControl: string,
      ) => {
        send(WsMessageType.ACCEPT_REMATCH, { gameId, opponentId, timeControl });
        useGameStore.getState().setRematchOffer(null);
      },
      declineRematch: (
        gameId: string,
        opponentId: string,
        timeControl: string,
      ) => {
        send(WsMessageType.DECLINE_REMATCH, {
          gameId,
          opponentId,
          timeControl,
        });
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
    }),
    [connect, send],
  );

  return api;
}
