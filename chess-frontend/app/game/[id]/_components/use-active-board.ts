import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  PieceDropHandlerArgs,
  SquareHandlerArgs,
  fenStringToPositionObject,
} from "react-chessboard";
import { Chess } from "chess.js";
import { useSocket } from "@/store/socket-provider";
import { COLOR, ActiveGame, GameOverState } from "@/types/chess";
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

function buildPositionObject(displayedFen: string, premoves: any[]) {
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
  premoves: any[],
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

function isPremoveLegal(
  source: string,
  target: string,
  displayedFen: string,
  isWhite: boolean,
  premovesRef: React.MutableRefObject<any[]>,
) {
  const tempGame = new Chess();
  try {
    let fenParts = displayedFen.split(" ");
    fenParts[1] = isWhite ? "w" : "b";
    fenParts[3] = "-";
    tempGame.load(fenParts.join(" "));
    for (const pm of premovesRef.current) {
      const p = tempGame.get(pm.sourceSquare as any);
      if (p) {
        tempGame.remove(pm.sourceSquare as any);
        tempGame.put(p, pm.targetSquare as any);
      }
    }

    let moves = tempGame.moves({ verbose: true });
    if (moves.some((m) => m.from === source && m.to === target)) return true;

    if (tempGame.get(target as any)?.type !== "k") {
      tempGame.remove(target as any);
      moves = tempGame.moves({ verbose: true });
      if (moves.some((m) => m.from === source && m.to === target)) return true;
      const enemyColor = isWhite ? "b" : "w";
      tempGame.put({ type: "p", color: enemyColor }, target as any);
      moves = tempGame.moves({ verbose: true });
      if (moves.some((m) => m.from === source && m.to === target)) return true;
    }
  } catch {
    return false;
  }
  return false;
}

function getValidMoveOptions(game: Chess, square: string) {
  const moves = game.moves({
    square: square as any,
    verbose: true,
  });

  if (moves.length === 0) return null;

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

  const [premoves, setPremoves] = useState<any[]>([]);
  const premovesRef = useRef<any[]>([]);
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
      (game.turn() === "w" ? COLOR.WHITE : COLOR.BLACK) ===
      (isWhite ? COLOR.WHITE : COLOR.BLACK);

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

    const turnColor = game.turn() === "w" ? COLOR.WHITE : COLOR.BLACK;
    const playerColor = isWhite ? COLOR.WHITE : COLOR.BLACK;

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

    const turnColor = game.turn() === "w" ? COLOR.WHITE : COLOR.BLACK;
    const playerColor = isWhite ? COLOR.WHITE : COLOR.BLACK;

    if (turnColor !== playerColor) {
      if (!moveFrom) {
        const pieceStr =
          typeof piece === "string" ? piece : (piece as any)?.pieceType;
        if (pieceStr && pieceStr[0] === (isWhite ? "w" : "b")) {
          setMoveFrom(square);
          setOptionSquares({
            [square]: { background: "rgba(255, 0, 0, 0.4)" },
          });
        }
        return;
      }

      if (moveFrom !== square) {
        if (
          isPremoveLegal(moveFrom, square, displayedFen, isWhite, premovesRef)
        ) {
          const pieceStr = position[moveFrom]?.pieceType;
          const isPawn = pieceStr && pieceStr[1] === "P";
          const isPromotion =
            isPawn && (square[1] === "8" || square[1] === "1");

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
        } else {
          playIllegalMoveSound();
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

    const moves = game.moves({ square: moveFrom as any, verbose: true });
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

  const onPieceDrop = (args: any) => {
    const { sourceSquare, targetSquare, piece } =
      args as PieceDropHandlerArgs & { piece?: any };
    if (
      !isPlayer ||
      isViewingHistory ||
      !targetSquare ||
      sourceSquare === targetSquare
    )
      return false;

    const turnColor = game.turn() === "w" ? COLOR.WHITE : COLOR.BLACK;
    const playerColor = isWhite ? COLOR.WHITE : COLOR.BLACK;

    const pieceStr = typeof piece === "string" ? piece : piece?.pieceType;
    const pieceColor = pieceStr
      ? pieceStr[0] === "w"
        ? COLOR.WHITE
        : COLOR.BLACK
      : playerColor;

    if (pieceColor !== playerColor) return false;

    if (turnColor !== playerColor) {
      if (
        isPremoveLegal(
          sourceSquare,
          targetSquare,
          displayedFen,
          isWhite,
          premovesRef,
        )
      ) {
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
      playIllegalMoveSound();
      return false;
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
