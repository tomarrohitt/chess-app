import { useWebSocket } from "@/hooks/use-websocket";
import { useGameStore } from "@/store/use-game-store";
import { Chessboard } from "react-chessboard";
import { MoveList } from "../../app/game/[id]/_components/move-list";
import { useMemo } from "react";
import { User } from "@/types/auth";

export function GameView({ user }: { user: User }) {
  const activeGame = useGameStore((s) => s.activeGame);
  if (!activeGame) return;
  const animations = useGameStore((s) => s.showAnimations);

  const { makeMove } = useWebSocket(user);
  const boardOptions = useMemo(() => ({
    id: "main-board",
    position: activeGame.fen,

    boardStyle: {
      width: Math.min(
        512,
        typeof window !== "undefined" ? window.innerWidth - 32 : 512,
      ),
    },
    darkSquareStyle: { backgroundColor: "#4a7c59" },
    lightSquareStyle: { backgroundColor: "#f0d9b5" },

    animationDurationInMs: 120,
    allowDrawingArrows: true,
    allowDragOffBoard: false,
  }), [
    activeGame.fen,
  ]);

  return (
    <div className="layout">
      <Chessboard
        options={{
          position: activeGame.fen,
          id: "main-board",
          showAnimations: animations,
          onPieceDrop: ({ sourceSquare, targetSquare }) => {
            if (!targetSquare) return false;
            makeMove(activeGame.gameId, sourceSquare, targetSquare);
            return true;
          }
        }}
      />
      <Chessboard options={boardOptions} />
      <MoveList pgn={activeGame.pgn} />
    </div>
  );
}