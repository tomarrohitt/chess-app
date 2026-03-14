"use client";
import { createContext, useContext, useEffect, useRef } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useGameStore } from "@/store/use-game-store";
import { useRouter, usePathname } from "next/navigation";
import { User } from "@/types/auth";

type SocketContextType = {
  joinQueue: (timeControl: string) => void;
  leaveQueue: () => void;
  makeMove: (gameId: string, from: string, to: string, promotion?: string) => void;
  resign: (gameId: string) => void;
  offerDraw: (gameId: string) => void;
  declineDraw: (gameId: string) => void;
  acceptDraw: (gameId: string) => void;
};

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ user, children }: { user: User; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { connect, joinQueue, leaveQueue, makeMove, resign, acceptDraw, declineDraw, offerDraw } = useWebSocket(user);
  const activeGameId = useGameStore((s) => s.activeGame?.gameId);
  const redirectedRef = useRef<string | null>(null);
  useEffect(() => { connect(); }, [connect]);

  useEffect(() => {
    if (!activeGameId) return;
    if (redirectedRef.current === activeGameId) return;
    if (pathname === `/game/${activeGameId}`) return;

    redirectedRef.current = activeGameId;
    router.push(`/game/${activeGameId}`);
  }, [activeGameId, pathname, router]);

  return (
    <SocketContext.Provider value={{ joinQueue, leaveQueue, makeMove, resign, acceptDraw, declineDraw, offerDraw }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
}