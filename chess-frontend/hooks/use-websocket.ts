import { useCallback, useEffect, useRef } from "react";
import { WsMessageType } from "../types/chess";
import { useGameStore } from "@/store/use-game-store";
import { User } from "@/types/auth";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";

export function useWebSocket(user: User) {
    const wsRef = useRef<WebSocket | null>(null);

    const send = useCallback((type: WsMessageType, payload?: any) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            // Start with just the type
            const message: { type: WsMessageType; payload?: any } = { type };

            // Only attach payload if it has actual data
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
        // Always get the freshest store actions

        switch (msg.type) {
            case WsMessageType.MOVE_MADE:
                store.handleMoveMade(msg.payload);
                break;
            case WsMessageType.MOVE_REJECTED:
                store.handleMoveRejected(msg.payload.reason);
                break;
            case WsMessageType.GAME_STARTED: store.handleGameStarted(msg.payload); break;
            case WsMessageType.GAME_STATE: store.handleGameState(msg.payload); break;
            case WsMessageType.GAME_OVER: store.handleGameOver(msg.payload); break;
            case WsMessageType.QUEUE_JOINED: store.setQueue("waiting"); break;
            case WsMessageType.QUEUE_LEFT: store.setQueue("idle"); break;
        }
    }, []);

    const connect = useCallback(() => {
        const store = useGameStore.getState();

        // FIX 1: Prevent Strict Mode from opening a 2nd connection while the 1st is still connecting
        if (
            wsRef.current &&
            (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)
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

        // FIX 2: Add explicit error and close logging to catch backend rejections
        ws.onerror = (error) => {
            console.error("[WS] Connection Error:", error);
            store.setConnection("error");
        };

        ws.onclose = (event) => {
            console.warn(`[WS] Closed. Code: ${event.code}, Reason: ${event.reason || "No reason given"}`);
            store.setConnection("disconnected");
            wsRef.current = null;
        };
    }, [handleMessage, user]); // Added user to dependencies

    // FIX 3: Cleanup function to close socket when component unmounts
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
        joinQueue: (timeControl: string) => send(WsMessageType.JOIN_QUEUE, { timeControl }),
        makeMove: (gameId: string, from: string, to: string, promotion?: string) =>
            send(WsMessageType.MAKE_MOVE, { gameId, from, to, promotion }),
        resign: (gameId: string) => send(WsMessageType.RESIGN_GAME, { gameId }),
    };
}