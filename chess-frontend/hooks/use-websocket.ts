import { useCallback, useEffect, useRef } from "react";
import { WsMessageType, GameStatus } from "../types/chess";
import { useGameStore } from "@/store/use-game-store";
import { User } from "@/types/auth";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";

export function useWebSocket(user: User) {
  const wsRef = useRef<WebSocket | null>(null);

  const send = useCallback((type: WsMessageType, payload?: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: { type: WsMessageType; payload?: any } = { type };
      if (payload !== undefined && payload !== null) {
        message.payload = payload;
      }
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn(`[WS] Cannot send ${type}, socket is not OPEN.`);
    }
  }, []);

  const handleMessage = useCallback((event: MessageEvent) => {
    const msg = JSON.parse(event.data);
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
        store.setQueue("idle");
        break;
      case WsMessageType.OFFER_DRAW:
        store.setDrawOffer(msg.payload);
        break;
      case WsMessageType.DECLINE_DRAW:
        store.setDrawOfferSent("declined");
        // Clear the "Draw declined" message after 5 seconds
        setTimeout(() => useGameStore.getState().setDrawOfferSent(null), 5000);
        break;
      case WsMessageType.GAME_ABORTED:
        store.handleGameOver({
          status: GameStatus.ABANDONED,
          reason: msg.payload?.reason || "aborted",
        });
        break;
      case WsMessageType.OFFER_REMATCH:
        store.setRematchOffer(msg.payload);
        break;
      case WsMessageType.DECLINE_REMATCH:
        store.setRematchOfferSent("declined");
        setTimeout(
          () => useGameStore.getState().setRematchOfferSent(null),
          5000,
        );
        break;
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
    store.setConnection("connecting");
    store.setUser(user);

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WS] Connected, requesting sync...");
      store.setConnection("connected");

      ws.send(JSON.stringify({ type: WsMessageType.SYNC_GAME }));
    };

    ws.onmessage = handleMessage;

    ws.onerror = (error) => {
      console.error("[WS] Connection Error:", error);
      store.setConnection("disconnected");
    };

    ws.onclose = (event) => {
      console.warn(
        `[WS] Closed. Code: ${event.code}, Reason: ${event.reason || "No reason given"}`,
      );
      store.setConnection("disconnected");
      wsRef.current = null;
    };
  }, [handleMessage, user]);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        console.log("[WS] Component unmounted, closing socket.");
        wsRef.current.close(1000, "Component unmounted");
        wsRef.current = null;
      }
    };
  }, []);

  return {
    connect,
    joinQueue: (timeControl: string) =>
      send(WsMessageType.JOIN_QUEUE, { timeControl }),
    leaveQueue: () => {
      send(WsMessageType.LEAVE_QUEUE);
      useGameStore.getState().setQueue("idle");
    },
    makeMove: (gameId: string, from: string, to: string, promotion?: string) =>
      send(WsMessageType.MAKE_MOVE, { gameId, from, to, promotion }),
    resign: (gameId: string) => send(WsMessageType.RESIGN_GAME, { gameId }),
    offerDraw: (gameId: string) => {
      send(WsMessageType.OFFER_DRAW, { gameId });
      useGameStore.getState().setDrawOfferSent("sent");
      // Expire the draw offer UI after 20 seconds
      setTimeout(() => {
        if (useGameStore.getState().drawOfferSent === "sent") {
          useGameStore.getState().setDrawOfferSent(null);
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
    offerRematch: (gameId: string, opponentId: string, timeControl: string) => {
      send(WsMessageType.OFFER_REMATCH, { gameId, opponentId, timeControl });
      useGameStore.getState().setRematchOfferSent("sent");
      setTimeout(() => {
        if (useGameStore.getState().rematchOfferSent === "sent") {
          useGameStore.getState().setRematchOfferSent(null);
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
      send(WsMessageType.DECLINE_REMATCH, { gameId, opponentId, timeControl });
      useGameStore.getState().setRematchOffer(null);
    },
  };
}
