"use client";

import { useSocket } from "@/store/socket-provider";
import { useGameStore } from "@/store/use-game-store";
import { useEffect } from "react";
import { Chessboard } from "react-chessboard";

export const SpectateComponent = ({ id }: { id: string }) => {
  const { spectateGame, leaveSpectator } = useSocket();
  const { activeGame } = useGameStore();

  useEffect(() => {
    spectateGame(id);
    return () => {
      leaveSpectator(id);
    };
  }, [id, spectateGame, leaveSpectator]);

  if (!activeGame) {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-400">
        Loading game state...
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-6 text-zinc-200">
        🔴 Spectating: {activeGame.whiteName} vs {activeGame.blackName}
      </h1>

      <div className="w-full max-w-lg">
        <Chessboard
          options={{
            position: activeGame.fen,
            boardOrientation: "white",
            allowDragging: false,
            darkSquareStyle: { backgroundColor: "#4a7c59" },
            lightSquareStyle: { backgroundColor: "#f0d9b5" },
            animationDurationInMs: 200,
          }}
        />
      </div>

      <p className="mt-4 text-zinc-500 text-sm">
        Updates are streaming via Redis Pub/Sub
      </p>
    </div>
  );
};
