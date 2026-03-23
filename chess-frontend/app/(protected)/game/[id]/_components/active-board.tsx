"use client";

import { Chessboard, defaultPieces } from "react-chessboard";
import { GameOverOverlay } from "./game-over-overlay";
import { COLOR, ActiveGame, GameOverState } from "@/types/chess";
import { sharedBoardOptions } from "./board-theme";
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

export function ActiveBoard({
  activeGame,
  isPlayer,
  isWhite,
  lastMoveRejectedReason,
  gameOver,
  userId,
  currentFen,
  isViewingHistory,
}: ActiveBoardProps) {
  const {
    position,
    combinedOptionSquares,
    promotionMove,
    setPromotionMove,
    onSquareClick,
    onPieceDrop,
    onSquareRightClick,
    onPromotionPieceSelect,
  } = useActiveBoard({
    activeGame,
    isPlayer,
    isWhite,
    lastMoveRejectedReason,
    gameOver,
    currentFen,
    isViewingHistory,
  });

  const boardOptions = {
    id: "active-board",
    position,
    boardOrientation: isWhite ? COLOR.WHITE : COLOR.BLACK,
    onPieceDrop,
    onSquareClick,
    onSquareRightClick,
    allowDragging: isPlayer && !isViewingHistory,
    allowDragOffBoard: false,
    squareStyles: combinedOptionSquares,
    ...sharedBoardOptions,
  };

  return (
    <div style={{ width: 500, height: 500 }}>
      <Chessboard options={boardOptions} />
      {promotionMove && (
        <>
          <div
            className="absolute inset-0 z-40 bg-black/20"
            onClick={() => setPromotionMove(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setPromotionMove(null);
            }}
          />
          <div
            className="absolute z-50 flex flex-col bg-zinc-100 shadow-2xl rounded overflow-hidden"
            style={{
              top: 0,
              left: `${
                isWhite
                  ? (promotionMove.targetSquare.charCodeAt(0) - 97) * 12.5
                  : (104 - promotionMove.targetSquare.charCodeAt(0)) * 12.5
              }%`,
              width: "12.5%",
            }}
          >
            {(["q", "n", "r", "b"] as const).map((p) => {
              const pieceKey =
                `${isWhite ? "w" : "b"}${p.toUpperCase()}` as keyof typeof defaultPieces;
              const PieceComponent = defaultPieces[pieceKey];
              return (
                <button
                  key={p}
                  onClick={() => onPromotionPieceSelect(p)}
                  className="w-full aspect-square flex items-center justify-center hover:bg-zinc-300 transition-colors"
                >
                  {PieceComponent && <PieceComponent />}
                </button>
              );
            })}
          </div>
        </>
      )}

      {lastMoveRejectedReason && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-600/90 text-white text-xs px-3 py-1.5 rounded-full whitespace-nowrap">
          {lastMoveRejectedReason}
        </div>
      )}

      {gameOver && <GameOverOverlay gameOver={gameOver} userId={userId} />}
    </div>
  );
}
