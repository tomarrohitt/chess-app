"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useMemo,
  useState,
} from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useGameStore } from "@/store/use-game-store";
import { useRouter, usePathname } from "next/navigation";
import { User } from "@/types/auth";

type SocketContextType = {
  joinQueue: (timeControl: string) => void;
  leaveQueue: () => void;
  makeMove: (
    gameId: string,
    from: string,
    to: string,
    promotion?: string,
  ) => void;
  resign: (gameId: string) => void;
  offerDraw: (gameId: string) => void;
  declineDraw: (gameId: string) => void;
  acceptDraw: (gameId: string) => void;
  offerRematch: (gameId: string, timeControl: string) => void;
  declineRematch: (gameId: string, timeControl: string) => void;
  acceptRematch: (gameId: string, timeControl: string) => void;
  spectateGame: (gameId: string) => void;
  leaveSpectator: (gameId: string) => void;

  joinGameChat: (gameId: string) => void;
  sendChatMessage: (gameId: string, content: string) => void;
  leaveGameChat: (gameId: string) => void;

  sendDirectMessage: (receiverId: string, content: string) => void;
  sendTyping: (receiverId: string, isTyping: boolean) => void;

  offerChallenge: (targetId: string, timeControl: string) => void;
  acceptChallenge: (targetId: string, timeControl: string) => void;
  declineChallenge: (targetId: string) => void;
};

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const wsApi = useWebSocket(user);
  const activeGameId = useGameStore((s) => s.activeGame?.gameId);
  const queueStatus = useGameStore((s) => s.queueStatus);
  const redirectedRef = useRef<string | null>(null);
  const wasInQueue = useRef(false);
  const wasChallenging = useRef(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    wsApi.connect();
  }, [wsApi.connect]);

  useEffect(() => {
    if (queueStatus === "waiting") {
      wasInQueue.current = true;
    }
  }, [queueStatus]);

  useEffect(() => {
    if (pathname === `/game/${activeGameId}`) {
      setIsTransitioning(false);
    }
  }, [pathname, activeGameId]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isTransitioning) {
      timeout = setTimeout(() => setIsTransitioning(false), 5000);
    }
    return () => clearTimeout(timeout);
  }, [isTransitioning]);

  useEffect(() => {
    if (!activeGameId) return;
    if (redirectedRef.current === activeGameId) return;
    if (pathname === `/game/${activeGameId}`) {
      redirectedRef.current = activeGameId;
      return;
    }

    const state = useGameStore.getState();
    const isPlayer =
      state.user?.id === state.activeGame?.white.id ||
      state.user?.id === state.activeGame?.black.id;

    if (isPlayer) {
      redirectedRef.current = activeGameId;

      if (
        wasInQueue.current ||
        wasChallenging.current ||
        pathname.startsWith("/game/")
      ) {
        wasInQueue.current = false;
        wasChallenging.current = false;
        setIsTransitioning(true);
        router.push(`/game/${activeGameId}`);
      }
    }
  }, [activeGameId, pathname, router]);

  const contextValue = useMemo(
    () => ({
      joinQueue: wsApi.joinQueue,
      leaveQueue: wsApi.leaveQueue,
      makeMove: wsApi.makeMove,
      resign: wsApi.resign,
      offerDraw: wsApi.offerDraw,
      declineDraw: wsApi.declineDraw,
      acceptDraw: wsApi.acceptDraw,
      offerRematch: wsApi.offerRematch,
      declineRematch: wsApi.declineRematch,
      acceptRematch: wsApi.acceptRematch,
      spectateGame: wsApi.spectateGame,
      leaveSpectator: wsApi.leaveSpectator,
      joinGameChat: wsApi.joinGameChat,
      sendChatMessage: wsApi.sendChatMessage,
      leaveGameChat: wsApi.leaveGameChat,
      sendDirectMessage: wsApi.sendDirectMessage,
      sendTyping: wsApi.sendTyping,
      offerChallenge: (targetId: string, tc: string) => {
        wasChallenging.current = true;
        wsApi.offerChallenge(targetId, tc);
      },
      acceptChallenge: (targetId: string, tc: string) => {
        wasChallenging.current = true;
        wsApi.acceptChallenge(targetId, tc);
      },
      declineChallenge: (targetId: string) => {
        wasChallenging.current = false;
        wsApi.declineChallenge(targetId);
      },
    }),
    [wsApi],
  );

  return (
    <SocketContext.Provider value={contextValue}>
      <div className={isTransitioning ? "hidden" : "contents"}>{children}</div>

      {isTransitioning && (
        <div className="fixed inset-0 z-50 min-h-screen flex items-center justify-center bg-zinc-950 text-white">
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <span className="text-6xl drop-shadow-lg select-none">♟</span>
            <p className="text-zinc-400 font-mono text-sm font-semibold tracking-widest uppercase">
              Entering Game...
            </p>
          </div>
        </div>
      )}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
}
