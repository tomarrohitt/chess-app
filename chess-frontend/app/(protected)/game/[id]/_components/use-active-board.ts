import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Chess, Square } from "chess.js";
import { useSocket } from "@/store/socket-provider";
import { ActiveGame, GameOverState } from "@/types/chess";
import { playAudio } from "@/lib/audio";
import type { Config } from "chessground/config";
import type { Key, Color } from "chessground/types";

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
  sourceSquare: Key;
  targetSquare: Key;
  promotion?: string;
}

function getDests(game: Chess): Map<Key, Key[]> {
  const dests = new Map<Key, Key[]>();
  const moves = game.moves({ verbose: true });
  for (const move of moves) {
    const from = move.from as Key;
    if (!dests.has(from)) dests.set(from, []);
    dests.get(from)!.push(move.to as Key);
  }
  return dests;
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

  const [optimisticState, setOptimisticState] = useState<{
    fen: string;
    lastMove: [Key, Key];
  } | null>(null);

  // Clear optimistic state when the server game state updates
  useEffect(() => {
    setOptimisticState(null);
  }, [activeGame.fen, activeGame.pgn]);

  const [promotionMove, setPromotionMove] = useState<{
    sourceSquare: Key;
    targetSquare: Key;
    isPremove?: boolean;
  } | null>(null);

  const [premoveQueue, setPremoveQueue] = useState<Premove[]>([]);

  const premovesRef = useRef<Premove[]>([]);

  const lastProcessedFen = useRef<string | null>(null);
  const prevRejectedReason = useRef<string | null>(null);

  const displayedFen =
    optimisticState?.fen || (isViewingHistory ? currentFen : activeGame.fen);

  const game = useMemo(() => {
    try {
      return new Chess(displayedFen);
    } catch {
      return new Chess();
    }
  }, [displayedFen]);

  const playerColor: Color = isWhite ? "white" : "black";
  const turnColor: Color = game.turn() === "w" ? "white" : "black";
  const isMyTurn = turnColor === playerColor;
  const canMove = isPlayer && !isViewingHistory && !gameOver;

  const updateQueue = useCallback((queue: Premove[]) => {
    premovesRef.current = queue;
    setPremoveQueue([...queue]);
  }, []);

  useEffect(() => {
    if (
      lastMoveRejectedReason &&
      lastMoveRejectedReason !== prevRejectedReason.current
    ) {
      playAudio("/incorrect.mp3");
    }
    prevRejectedReason.current = lastMoveRejectedReason;
  }, [lastMoveRejectedReason]);

  useEffect(() => {
    if (!isPlayer || isViewingHistory || gameOver) return;
    if (displayedFen === lastProcessedFen.current) return;
    if (!isMyTurn || premovesRef.current.length === 0) return;

    lastProcessedFen.current = displayedFen;
    const next = premovesRef.current.shift()!;

    const moves = game.moves({ verbose: true });
    const legal = moves.some(
      (m) => m.from === next.sourceSquare && m.to === next.targetSquare,
    );

    if (legal) {
      const remaining = [...premovesRef.current];
      updateQueue(remaining);

      const move = game.move({
        from: next.sourceSquare as string,
        to: next.targetSquare as string,
        promotion: next.promotion || "q",
      });
      if (move) {
        setOptimisticState({
          fen: game.fen(),
          lastMove: [next.sourceSquare, next.targetSquare],
        });
      }

      makeMove(
        activeGame.gameId,
        next.sourceSquare,
        next.targetSquare,
        next.promotion || "q",
      );
    } else {
      updateQueue([]);
    }
  }, [
    displayedFen,
    isMyTurn,
    isPlayer,
    isViewingHistory,
    gameOver,
    game,
    makeMove,
    activeGame.gameId,
    updateQueue,
  ]);

  const afterMove = useCallback(
    (from: Key, to: Key) => {
      if (!canMove) return;

      const piece = game.get(from as Square);
      const isPromotion =
        piece?.type === "p" &&
        ((isWhite && to[1] === "8") || (!isWhite && to[1] === "1"));

      if (isPromotion) {
        setPromotionMove({ sourceSquare: from, targetSquare: to });
        return;
      }

      const move = game.move({
        from: from as string,
        to: to as string,
      });
      if (move) {
        setOptimisticState({
          fen: game.fen(),
          lastMove: [from, to],
        });
      }

      makeMove(activeGame.gameId, from, to, undefined);
      lastProcessedFen.current = game.fen();
    },
    [canMove, game, isWhite, makeMove, activeGame.gameId],
  );

  const afterPremove = useCallback(
    (from: Key, to: Key) => {
      const piece = game.get(from as Square);
      const isPromotion =
        piece?.type === "p" &&
        ((isWhite && to[1] === "8") || (!isWhite && to[1] === "1"));

      if (isPromotion) {
        setPromotionMove({
          sourceSquare: from,
          targetSquare: to,
          isPremove: true,
        });
        return;
      }
      updateQueue([
        ...premovesRef.current,
        { sourceSquare: from, targetSquare: to },
      ]);
    },
    [game, isWhite, updateQueue],
  );

  const onPromotionPieceSelect = useCallback(
    (piece: string) => {
      if (!promotionMove) return;
      if (promotionMove.isPremove) {
        premovesRef.current.push({
          sourceSquare: promotionMove.sourceSquare,
          targetSquare: promotionMove.targetSquare,
          promotion: piece,
        });
      } else {
        const move = game.move({
          from: promotionMove.sourceSquare as string,
          to: promotionMove.targetSquare as string,
          promotion: piece,
        });
        if (move) {
          setOptimisticState({
            fen: game.fen(),
            lastMove: [promotionMove.sourceSquare, promotionMove.targetSquare],
          });
        }

        makeMove(
          activeGame.gameId,
          promotionMove.sourceSquare,
          promotionMove.targetSquare,
          piece,
        );
      }
      setPromotionMove(null);
    },
    [promotionMove, makeMove, activeGame.gameId, game],
  );

  const lastMove = useMemo((): [Key, Key] | undefined => {
    if (optimisticState) {
      return optimisticState.lastMove;
    }

    const pgn = activeGame.pgn;
    if (!pgn) return undefined;
    try {
      const tmp = new Chess();
      tmp.loadPgn(pgn);
      const hist = tmp.history({ verbose: true });
      if (hist.length === 0) return undefined;
      const last = hist[hist.length - 1];
      return [last.from as Key, last.to as Key];
    } catch {
      return undefined;
    }
  }, [activeGame.pgn, optimisticState]);

  const cgConfig = useMemo(
    (): Partial<Config> => ({
      fen: displayedFen,
      orientation: playerColor,
      turnColor,
      check: game.inCheck(),
      lastMove,
      movable: {
        color: canMove ? playerColor : undefined,
        dests: canMove && isMyTurn ? getDests(game) : new Map(),
        free: false,
        events: {
          after: afterMove,
        },
      },
      premovable: {
        enabled: canMove && !isMyTurn,
        castle: true,
        showDests: true,
        events: {
          set: afterPremove,
          unset: () => {},
        },
      },
      drawable: {
        enabled: true,
        visible: true,
        autoShapes: premoveQueue.flatMap((move, i) => [
          {
            orig: move.sourceSquare,
            dest: move.targetSquare,
            brush: i === 0 ? "paleBlue" : "paleGrey",
            modifiers: { lineWidth: 10 },
          },
        ]),
      },
      draggable: { enabled: canMove },
      selectable: { enabled: true },
    }),
    [
      displayedFen,
      playerColor,
      turnColor,
      game,
      canMove,
      isMyTurn,
      lastMove,
      afterMove,
      afterPremove,
      premoveQueue,
    ],
  );

  return {
    cgConfig,
    promotionMove,
    setPromotionMove,
    onPromotionPieceSelect,
    premoveQueue,
  };
}
