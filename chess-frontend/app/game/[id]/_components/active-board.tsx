"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Chessboard,
  PieceDropHandlerArgs,
  SquareHandlerArgs,
  defaultPieces,
} from "react-chessboard";
import { Chess } from "chess.js";
import { GameOverOverlay } from "./game-over-overlay";
import { useSocket } from "@/store/socket-provider";
import { COLOR, ActiveGame, GameOverState } from "@/types/chess";

interface ActiveBoardProps {
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
  const { makeMove } = useSocket();

  const [moveFrom, setMoveFrom] = useState<string>("");
  const [optionSquares, setOptionSquares] = useState<
    Record<string, React.CSSProperties>
  >({});
  const [promotionMove, setPromotionMove] = useState<{
    sourceSquare: string;
    targetSquare: string;
  } | null>(null);

  const displayedFen = currentFen || activeGame.fen;

  const game = useMemo(() => {
    try {
      return new Chess(displayedFen);
    } catch {
      return new Chess();
    }
  }, [displayedFen]);

  useEffect(() => {
    setMoveFrom("");
    setOptionSquares({});
    setPromotionMove(null);
  }, [displayedFen, lastMoveRejectedReason]);

  function getMoveOptions(square: string) {
    const moves = game.moves({
      square: square as any,
      verbose: true,
    });

    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares: Record<string, React.CSSProperties> = {};
    for (const move of moves) {
      const isCapture =
        game.get(move.to as any) &&
        game.get(move.to as any)?.color !== game.get(square as any)?.color;

      newSquares[move.to] = {
        background: isCapture
          ? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)"
          : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
        borderRadius: "50%",
      };
    }

    newSquares[square] = {
      background: "rgba(255, 255, 0, 0.4)",
    };

    setOptionSquares(newSquares);
    return true;
  }

  function onSquareClick({ square, piece }: SquareHandlerArgs) {
    if (!isPlayer || isViewingHistory) return;

    // From square
    if (!moveFrom) {
      if (piece) {
        const hasMoveOptions = getMoveOptions(square);
        if (hasMoveOptions) setMoveFrom(square);
      }
      return;
    }

    // To square
    const moves = game.moves({
      square: moveFrom as any,
      verbose: true,
    });
    const foundMove = moves.find((m) => m.from === moveFrom && m.to === square);

    if (!foundMove) {
      // If clicked on another piece, check its options instead of doing nothing
      const hasMoveOptions = getMoveOptions(square);
      setMoveFrom(hasMoveOptions ? square : "");
      return;
    }

    // Validate move safely without mutating the shared 'game' instance
    try {
      const tempGame = new Chess(displayedFen);
      const move = tempGame.move({
        from: moveFrom,
        to: square,
        promotion: "q",
      });

      if (move) {
        if (move.promotion) {
          setPromotionMove({
            sourceSquare: moveFrom,
            targetSquare: square,
          });
          setMoveFrom("");
          setOptionSquares({});
          return;
        }

        makeMove(activeGame.gameId, moveFrom, square, move.promotion);
        setMoveFrom("");
        setOptionSquares({});
      }
    } catch (e) {
      // Invalid move fallback
      const hasMoveOptions = getMoveOptions(square);
      setMoveFrom(hasMoveOptions ? square : "");
    }
  }

  const onPieceDrop = ({
    sourceSquare,
    targetSquare,
  }: PieceDropHandlerArgs) => {
    if (!isPlayer) return false;
    if (isViewingHistory) return false;
    if (!targetSquare) return false;

    // Validate move safely without mutating the shared 'game' instance
    try {
      const tempGame = new Chess(displayedFen);
      const move = tempGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q", // Default to queen, can be updated later when promotion dialog is added
      });

      if (move) {
        if (move.promotion) {
          setPromotionMove({ sourceSquare, targetSquare });
          setMoveFrom("");
          setOptionSquares({});
          return true;
        }

        makeMove(activeGame.gameId, sourceSquare, targetSquare, move.promotion);
        setMoveFrom("");
        setOptionSquares({});
        return true;
      }
    } catch (e) {
      // Invalid move according to chess.js
      return false;
    }
    return false;
  };

  function onPromotionPieceSelect(piece: string) {
    if (!promotionMove) return;
    makeMove(
      activeGame.gameId,
      promotionMove.sourceSquare,
      promotionMove.targetSquare,
      piece,
    );
    setPromotionMove(null);
  }

  const boardOptions = {
    id: "active-board",
    position: displayedFen,
    animationDurationInMs: 200,
    boardOrientation: isWhite ? COLOR.WHITE : COLOR.BLACK,
    onPieceDrop,
    onSquareClick,
    allowDragging: isPlayer && !isViewingHistory,
    allowDragOffBoard: false,
    squareStyles: optionSquares,
    darkSquareStyle: { backgroundColor: "#4a7c59" },
    lightSquareStyle: { backgroundColor: "#f0d9b5" },
  };

  return (
    <div className="relative">
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
