"use client";
import { createContext, useContext, useEffect, useRef, useMemo } from "react";
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
  offerRematch: (
    gameId: string,
    opponentId: string,
    timeControl: string,
  ) => void;
  declineRematch: (
    gameId: string,
    opponentId: string,
    timeControl: string,
  ) => void;
  acceptRematch: (
    gameId: string,
    opponentId: string,
    timeControl: string,
  ) => void;
  spectateGame: (gameId: string) => void;
  leaveSpectator: (gameId: string) => void;
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
  const redirectedRef = useRef<string | null>(null);
  useEffect(() => {
    wsApi.connect();
  }, [wsApi.connect]);

  console.log({ activeGameId });

  useEffect(() => {
    if (!activeGameId) return;
    if (redirectedRef.current === activeGameId) return;
    if (
      pathname === `/game/${activeGameId}` ||
      pathname === `/game/${activeGameId}/spectate`
    )
      return;

    const state = useGameStore.getState();
    const isPlayer =
      state.user?.id === state.activeGame?.white.id ||
      state.user?.id === state.activeGame?.black.id;

    if (isPlayer) {
      redirectedRef.current = activeGameId;
      router.push(`/game/${activeGameId}`);
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
    }),
    [wsApi],
  );

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
}
