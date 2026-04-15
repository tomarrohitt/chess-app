import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  PieceDropHandlerArgs,
  SquareHandlerArgs,
  fenStringToPositionObject,
} from "react-chessboard";
import { Chess, Square } from "chess.js";
import { useSocket } from "@/store/socket-provider";
import { FullColor, ActiveGame, GameOverState } from "@/types/chess";
import { playAudio } from "@/lib/audio";

export interface UseActiveBoardProps {
  activeGame: ActiveGame;
  isPlayer: boolean;
  isWhite: boolean;
  lastMoveRejectedReason: string | null;
  gameOver: GameOverState | null;
  currentFen?: string;
  isViewingHistory?: boolean;
}

export interface Premove {
  sourceSquare: string;
  targetSquare: string;
  piece?: string;
  promotion?: string;
}

function buildPositionObject(displayedFen: string, premoves: Premove[]) {
  const pos = fenStringToPositionObject(displayedFen, 8, 8) as Record<
    string,
    { pieceType: string }
  >;
  for (const premove of premoves) {
    const movingPiece = premove.piece || pos[premove.sourceSquare]?.pieceType;
    delete pos[premove.sourceSquare];
    if (premove.targetSquare && movingPiece) {
      const pieceType = premove.promotion
        ? `${movingPiece[0]}${premove.promotion.toUpperCase()}`
        : (movingPiece as string);
      pos[premove.targetSquare] = { pieceType };
    }
  }
  return pos;
}

function buildCombinedOptionSquares(
  optionSquares: Record<string, React.CSSProperties>,
  premoves: Premove[],
) {
  const styles: Record<string, React.CSSProperties> = { ...optionSquares };
  for (const premove of premoves) {
    styles[premove.sourceSquare] = {
      ...styles[premove.sourceSquare],
      backgroundColor: "rgba(255, 0, 0, 0.4)",
    };
    if (premove.targetSquare) {
      styles[premove.targetSquare] = {
        ...styles[premove.targetSquare],
        backgroundColor: "rgba(255, 0, 0, 0.4)",
      };
    }
  }
  return styles;
}

function getValidMoveOptions(game: Chess, square: string) {
  const moves = game.moves({
    square: square as Square,
    verbose: true,
  });

  if (moves.length === 0) return null;

  const newSquares: Record<string, React.CSSProperties> = {};
  for (const move of moves) {
    const isCapture =
      game.get(move.to as Square) &&
      game.get(move.to as Square)?.color !== game.get(square as Square)?.color;

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

  return newSquares;
}

export function useActiveBoard({
  activeGame,
  isPlayer,
  isWhite,
  lastMoveRejectedReason,
  gameOver,
  currentFen,
  isViewingHistory,
}: UseActiveBoardProps) {
  const { makeMove } = useSocket();

  const [moveFrom, setMoveFrom] = useState<string>("");
  const [optionSquares, setOptionSquares] = useState<
    Record<string, React.CSSProperties>
  >({});
  const [promotionMove, setPromotionMove] = useState<{
    sourceSquare: string;
    targetSquare: string;
    isPremove?: boolean;
  } | null>(null);

  const [premoves, setPremoves] = useState<Premove[]>([]);
  const premovesRef = useRef<Premove[]>([]);
  const lastProcessedFen = useRef<string | null>(null);
  const prevRejectedReason = useRef<string | null>(null);

  const displayedFen = currentFen || activeGame.fen;

  const game = useMemo(() => {
    try {
      return new Chess(displayedFen);
    } catch {
      return new Chess();
    }
  }, [displayedFen]);

  const position = useMemo(
    () => buildPositionObject(displayedFen, premoves),
    [displayedFen, premoves],
  );

  const combinedOptionSquares = useMemo(
    () => buildCombinedOptionSquares(optionSquares, premoves),
    [optionSquares, premoves],
  );

  const playIllegalMoveSound = (forcePlay = false) => {
    const isMyTurn =
      (game.turn() === "w" ? FullColor.WHITE : FullColor.BLACK) ===
      (isWhite ? FullColor.WHITE : FullColor.BLACK);

    if (forcePlay || (isMyTurn && game.inCheck())) {
      playAudio("/incorrect.mp3");
    }
  };

  const handleSelectSquare = (square: string) => {
    const options = getValidMoveOptions(game, square);
    if (options) {
      setOptionSquares(options);
      setMoveFrom(square);
    } else {
      setOptionSquares({});
      if (square !== moveFrom) playIllegalMoveSound();
      setMoveFrom("");
    }
  };

  useEffect(() => {
    if (
      lastMoveRejectedReason &&
      lastMoveRejectedReason !== prevRejectedReason.current
    ) {
      playIllegalMoveSound(true);
    }
    prevRejectedReason.current = lastMoveRejectedReason;

    setMoveFrom("");
    setOptionSquares({});
    setPromotionMove(null);
  }, [displayedFen, lastMoveRejectedReason]);

  useEffect(() => {
    if (!isPlayer || isViewingHistory || gameOver) return;
    if (displayedFen === lastProcessedFen.current) return;

    const turnColor = game.turn() === "w" ? FullColor.WHITE : FullColor.BLACK;
    const playerColor = isWhite ? FullColor.WHITE : FullColor.BLACK;

    if (turnColor === playerColor && premovesRef.current.length > 0) {
      lastProcessedFen.current = displayedFen;

      const nextPremove = premovesRef.current[0];
      premovesRef.current.splice(0, 1);

      const moves = game.moves({ verbose: true });
      const isLegal = moves.some(
        (m) =>
          m.from === nextPremove.sourceSquare &&
          m.to === nextPremove.targetSquare,
      );

      setPremoves([...premovesRef.current]);

      if (isLegal) {
        makeMove(
          activeGame.gameId,
          nextPremove.sourceSquare,
          nextPremove.targetSquare,
          nextPremove.promotion || "q",
        );
      } else {
        premovesRef.current = [];
        setPremoves([]);
      }
    }
  }, [
    displayedFen,
    isPlayer,
    isViewingHistory,
    gameOver,
    isWhite,
    activeGame.gameId,
    makeMove,
    game,
  ]);

  function onSquareClick({ square, piece }: SquareHandlerArgs) {
    if (!isPlayer || isViewingHistory) return;

    const turnColor = game.turn() === "w" ? FullColor.WHITE : FullColor.BLACK;
    const playerColor = isWhite ? FullColor.WHITE : FullColor.BLACK;

    if (turnColor !== playerColor) {
      if (!moveFrom) {
        const pieceStr =
          typeof piece === "string"
            ? piece
            : (piece as { pieceType?: string })?.pieceType;
        if (pieceStr && pieceStr[0] === (isWhite ? "w" : "b")) {
          setMoveFrom(square);
          setOptionSquares({
            [square]: { background: "rgba(255, 0, 0, 0.4)" },
          });
        }
        return;
      }

      if (moveFrom !== square) {
        const pieceStr = position[moveFrom]?.pieceType;
        const isPawn = pieceStr && pieceStr[1] === "P";
        const isPromotion = isPawn && (square[1] === "8" || square[1] === "1");

        if (isPromotion) {
          setPromotionMove({
            sourceSquare: moveFrom,
            targetSquare: square,
            isPremove: true,
          });
        } else {
          premovesRef.current.push({
            sourceSquare: moveFrom,
            targetSquare: square,
            piece: pieceStr,
          });
          setPremoves([...premovesRef.current]);
        }
      }
      setMoveFrom("");
      setOptionSquares({});
      return;
    }

    if (!moveFrom) {
      if (piece) handleSelectSquare(square);
      return;
    }

    const moves = game.moves({ square: moveFrom as Square, verbose: true });
    const foundMove = moves.find((m) => m.from === moveFrom && m.to === square);

    if (!foundMove) {
      handleSelectSquare(square);
      return;
    }

    try {
      const tempGame = new Chess(displayedFen);
      const move = tempGame.move({
        from: moveFrom,
        to: square,
        promotion: "q",
      });

      if (move) {
        if (move.promotion) {
          setPromotionMove({ sourceSquare: moveFrom, targetSquare: square });
          setMoveFrom("");
          setOptionSquares({});
          return;
        }

        makeMove(activeGame.gameId, moveFrom, square, move.promotion);
        lastProcessedFen.current = displayedFen;
        setMoveFrom("");
        setOptionSquares({});
      } else {
        handleSelectSquare(square);
      }
    } catch {
      handleSelectSquare(square);
    }
  }

  const onPieceDrop = (args: PieceDropHandlerArgs & { piece?: unknown }) => {
    const { sourceSquare, targetSquare, piece } = args;
    if (
      !isPlayer ||
      isViewingHistory ||
      !targetSquare ||
      sourceSquare === targetSquare
    )
      return false;

    const turnColor = game.turn() === "w" ? FullColor.WHITE : FullColor.BLACK;
    const playerColor = isWhite ? FullColor.WHITE : FullColor.BLACK;

    const pieceStr =
      typeof piece === "string"
        ? piece
        : (piece as { pieceType?: string })?.pieceType;
    const pieceColor = pieceStr
      ? pieceStr[0] === "w"
        ? FullColor.WHITE
        : FullColor.BLACK
      : playerColor;

    if (pieceColor !== playerColor) return false;

    if (turnColor !== playerColor) {
      const isPawn = pieceStr && pieceStr[1] === "P";
      const isPromotion =
        isPawn && (targetSquare[1] === "8" || targetSquare[1] === "1");

      if (isPromotion) {
        setPromotionMove({ sourceSquare, targetSquare, isPremove: true });
      } else {
        premovesRef.current.push({
          sourceSquare,
          targetSquare,
          piece: pieceStr,
        });
        setPremoves([...premovesRef.current]);
      }
      return true;
    }

    try {
      const tempGame = new Chess(displayedFen);
      const move = tempGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (move) {
        if (move.promotion) {
          setPromotionMove({ sourceSquare, targetSquare });
          setMoveFrom("");
          setOptionSquares({});
          return true;
        }

        makeMove(activeGame.gameId, sourceSquare, targetSquare, move.promotion);
        lastProcessedFen.current = displayedFen;
        setMoveFrom("");
        setOptionSquares({});
        return true;
      }
    } catch {
      playIllegalMoveSound();
      return false;
    }
    playIllegalMoveSound();
    return false;
  };

  function onPromotionPieceSelect(piece: string) {
    if (!promotionMove) return;

    if (promotionMove.isPremove) {
      const pieceStr =
        position[promotionMove.sourceSquare]?.pieceType ||
        (isWhite ? "wP" : "bP");
      premovesRef.current.push({
        sourceSquare: promotionMove.sourceSquare,
        targetSquare: promotionMove.targetSquare,
        piece: pieceStr,
        promotion: piece,
      });
      setPremoves([...premovesRef.current]);
    } else {
      makeMove(
        activeGame.gameId,
        promotionMove.sourceSquare,
        promotionMove.targetSquare,
        piece,
      );
    }
    setPromotionMove(null);
  }

  function onSquareRightClick() {
    if (premovesRef.current.length > 0) {
      premovesRef.current = [];
      setPremoves([]);
    }
  }

  return {
    position,
    combinedOptionSquares,
    promotionMove,
    setPromotionMove,
    onSquareClick,
    onPieceDrop,
    onSquareRightClick,
    onPromotionPieceSelect,
  };
}
