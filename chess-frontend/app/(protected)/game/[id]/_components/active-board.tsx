"use client";
import { memo } from "react";

import Chessground from "@bezalel6/react-chessground";

import { GameOverOverlay } from "./game-over-overlay";
import { ActiveGame, GameOverState } from "@/types/chess";
import { useActiveBoard } from "./use-active-board";

export interface ActiveBoardProps {
  activeGame: ActiveGame;
  isPlayer: boolean;
  isWhite: boolean;
  lastMoveRejectedReason: string | null;
  gameOver: GameOverState | null;
  userId: string;
  currentFen?: string;
  isViewingHistory?: boolean;
}

const PROMOTION_PIECES = ["q", "n", "r", "b"] as const;

const PIECE_UNICODE: Record<string, Record<string, string>> = {
  w: { q: "♕", n: "♘", r: "♖", b: "♗" },
  b: { q: "♛", n: "♞", r: "♜", b: "♝" },
};

export const ActiveBoard = memo(function ActiveBoard({
  activeGame,
  isPlayer,
  isWhite,
  lastMoveRejectedReason,
  gameOver,
  userId,
  currentFen,
  isViewingHistory,
}: ActiveBoardProps) {
  const { cgConfig, promotionMove, setPromotionMove, onPromotionPieceSelect } =
    useActiveBoard({
      activeGame,
      isPlayer,
      isWhite,
      lastMoveRejectedReason,
      gameOver,
      currentFen,
      isViewingHistory,
    });

  const colorKey = isWhite ? "w" : "b";

  return (
    <div style={{ width: 500, height: 500 }} className="relative">
      <Chessground width={500} height={500} {...cgConfig} />

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

      {gameOver && <GameOverOverlay gameOver={gameOver} userId={userId} />}
    </div>
  );
});
