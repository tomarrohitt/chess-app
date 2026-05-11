import { memo } from "react";

import Chessground from "@bezalel6/react-chessground";

import { GameOverOverlay } from "./game-over-overlay";
import { useActiveBoard } from "./use-active-board";
import { useGameStore } from "@/store/use-game-store";

export interface ActiveBoardProps {
  currentFen?: string;
  isViewingHistory?: boolean;
}

const PROMOTION_PIECES = ["q", "n", "r", "b"] as const;

const PIECE_UNICODE: Record<string, Record<string, string>> = {
  w: { q: "♕", n: "♘", r: "♖", b: "♗" },
  b: { q: "♛", n: "♞", r: "♜", b: "♝" },
};

export const ActiveBoard = memo(function ActiveBoard({
  currentFen,
  isViewingHistory,
}: ActiveBoardProps) {
  const activeGame = useGameStore((s) => s.activeGame);
  const gameOver = useGameStore((s) => s.gameOver);
  const currentUserId = useGameStore((s) => s.user?.id);
  const isWhite = currentUserId === activeGame?.white.id;

  const lastMoveRejectedReason = useGameStore((s) => s.lastMoveRejectedReason);

  const isPlayer =
    currentUserId === activeGame?.white.id ||
    currentUserId === activeGame?.black.id;

  const colorKey = isWhite ? "w" : "b";

  const squareToPosition = (square: string) => {
    const file = square.charCodeAt(0) - 97;
    const rank = parseInt(square[1]) - 1;
    const x = isWhite ? file : 7 - file;
    const y = isWhite ? 7 - rank : rank;
    return { left: `${x * 12.5}%`, top: `${y * 12.5}%` };
  };

  const {
    cgConfig,
    promotionMove,
    setPromotionMove,
    onPromotionPieceSelect,
    premoveQueue,
  } = useActiveBoard({
    activeGame: activeGame!,
    isPlayer,
    isWhite,
    lastMoveRejectedReason,
    gameOver,
    currentFen,
    isViewingHistory,
  });

  if (!currentUserId) return;

  return (
    <div style={{ width: 500, height: 500 }} className="relative">
      <Chessground width={500} height={500} {...cgConfig} />

      {premoveQueue
        .flatMap((move, i) => [
          { sq: move.sourceSquare, i },
          { sq: move.targetSquare, i },
        ])
        .map(({ sq, i }) => (
          <div
            key={`${sq}-${i}`}
            className="absolute pointer-events-none"
            style={{
              ...squareToPosition(sq),
              width: "12.5%",
              height: "12.5%",
              backgroundColor:
                i === 0 ? "rgba(100,180,255,0.5)" : "rgba(180,180,180,0.35)",
            }}
          />
        ))}

      {promotionMove && (
        <>
          <div
            className="absolute inset-0 z-40"
            onClick={() => setPromotionMove(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setPromotionMove(null);
            }}
            style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
          />
          <div
            className="absolute z-50 flex flex-col shadow-2xl rounded overflow-hidden"
            style={{
              backgroundColor: "#f4f4f5",
              top: 0,
              left: `${
                isWhite
                  ? (promotionMove.targetSquare.charCodeAt(0) - 97) * 12.5
                  : (104 - promotionMove.targetSquare.charCodeAt(0)) * 12.5
              }%`,
              width: "12.5%",
            }}
          >
            {PROMOTION_PIECES.map((p) => (
              <button
                key={p}
                onClick={() => onPromotionPieceSelect(p)}
                className="w-full aspect-square flex items-center justify-center hover:bg-zinc-300 transition-colors text-3xl"
              >
                {PIECE_UNICODE[colorKey][p]}
              </button>
            ))}
          </div>
        </>
      )}

      {lastMoveRejectedReason && (
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 text-white text-xs px-3 py-1.5 rounded-full whitespace-nowrap z-50"
          style={{ backgroundColor: "rgba(220,38,38,0.9)" }}
        >
          {lastMoveRejectedReason}
        </div>
      )}

      {gameOver && (
        <GameOverOverlay gameOver={gameOver} userId={currentUserId} />
      )}
    </div>
  );
});
