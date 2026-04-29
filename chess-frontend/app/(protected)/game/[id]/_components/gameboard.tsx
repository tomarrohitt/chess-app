"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "@/store/use-game-store";
import { User } from "@/types/auth";
import { GameStatus, PlayerColor } from "@/types/chess";
import { useSocket } from "@/store/socket-provider";
import { GameSidebar } from "./game-sidebar";
import { PlayerArea } from "./player-area";
import { getPlayerAdvantages } from "./advantage";
import { useTimeline } from "@/hooks/use-timeline";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation";
import { useGameAudio } from "@/hooks/use-game-audio";
import { Clock, ClockProvider } from "./clock";
import { CapturedPieces } from "@/worker/chess-worker";
import { useChessWorker } from "@/worker/use-chess-worker";
import { ActiveBoard } from "./active-board";

interface GameboardProps {
  gameId: string;
  user: User;
}

const EMPTY_CAPTURED: CapturedPieces = {
  capturedByWhite: [],
  capturedByBlack: [],
};

export function Gameboard({ gameId, user }: GameboardProps) {
  const {
    activeGame,
    gameOver,
    lastMoveRejectedReason,
    drawOffer,
    rematchOffer,
  } = useGameStore(
    useShallow((s) => ({
      activeGame: s.activeGame,
      gameOver: s.gameOver,
      lastMoveRejectedReason: s.lastMoveRejectedReason,
      drawOffer: s.drawOffer,
      rematchOffer: s.rematchOffer,
    })),
  );

  const [spectatorFlipped, setSpectatorFlipped] = useState(false);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);

  const worker = useChessWorker();

  const [capturedPieces, setCapturedPieces] =
    useState<CapturedPieces>(EMPTY_CAPTURED);

  const { spectateGame, leaveSpectator } = useSocket();
  useEffect(() => {
    spectateGame(gameId);
    return () => leaveSpectator(gameId);
  }, [gameId]);

  const isPlayer =
    user.id === activeGame?.white.id || user.id === activeGame?.black.id;
  const isWhite = isPlayer
    ? user.id === activeGame?.white.id
    : !spectatorFlipped;
  const topColor = isWhite ? PlayerColor.BLACK : PlayerColor.WHITE;
  const bottomColor = isWhite ? PlayerColor.WHITE : PlayerColor.BLACK;

  const timeline = useTimeline(activeGame?.pgn);
  const latestIndex = timeline.history.length - 1;
  const currentMoveIndex = viewingIndex !== null ? viewingIndex : latestIndex;
  const isViewingHistory = viewingIndex !== null;

  const handleArrowLeft = useCallback(() => {
    setViewingIndex((prev) => {
      const cur = prev !== null ? prev : latestIndex;
      return Math.max(-1, cur - 1);
    });
  }, [latestIndex]);

  const handleArrowRight = useCallback(() => {
    setViewingIndex((prev) => {
      const cur = prev !== null ? prev : latestIndex;
      const next = Math.min(latestIndex, cur + 1);
      return next === latestIndex ? null : next;
    });
  }, [latestIndex]);

  const handleArrowUp = useCallback(() => setViewingIndex(-1), []);
  const handleArrowDown = useCallback(() => setViewingIndex(null), []);
  const handleMoveClick = useCallback(
    (index: number) => setViewingIndex(index === latestIndex ? null : index),
    [latestIndex],
  );

  useKeyboardNavigation({
    onArrowLeft: handleArrowLeft,
    onArrowRight: handleArrowRight,
    onArrowUp: handleArrowUp,
    onArrowDown: handleArrowDown,
  });

  useGameAudio({
    history: timeline.history,
    currentMoveIndex,
    isPlayer,
    isWhite,
    userId: user.id,
    gameOver: gameOver,
    gameId: activeGame?.gameId,
    drawOffer,
    rematchOffer,
  });

  const currentFen = useMemo(
    () =>
      (activeGame && timeline.fens[currentMoveIndex + 1]) ||
      activeGame?.fen ||
      "",
    [activeGame, timeline.fens, currentMoveIndex],
  );

  useEffect(() => {
    if (!worker || !currentFen) return;
    let cancelled = false;
    worker.getCapturedPieces(currentFen).then((result) => {
      if (!cancelled) {
        setCapturedPieces((prev) => {
          if (
            prev.capturedByWhite.join() === result.capturedByWhite.join() &&
            prev.capturedByBlack.join() === result.capturedByBlack.join()
          ) {
            return prev;
          }
          return result;
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [worker, currentFen]);

  const dynamicWhite = useMemo(
    () =>
      activeGame
        ? {
            ...activeGame.white,
            capturedPieces: capturedPieces.capturedByWhite,
            timeLeftMs: activeGame.white.timeLeftMs,
          }
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      activeGame?.white.id,
      activeGame?.white.username,
      activeGame?.white.rating,
      activeGame?.white.image,
      capturedPieces.capturedByWhite,
    ],
  );

  const dynamicBlack = useMemo(
    () =>
      activeGame
        ? {
            ...activeGame.black,
            capturedPieces: capturedPieces.capturedByBlack,
            timeLeftMs: activeGame.black.timeLeftMs,
          }
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      activeGame?.black.id,
      activeGame?.black.username,
      activeGame?.black.rating,
      activeGame?.black.image,
      capturedPieces.capturedByBlack,
    ],
  );

  const topPlayer =
    topColor === PlayerColor.WHITE ? dynamicWhite : dynamicBlack;
  const bottomPlayer =
    bottomColor === PlayerColor.WHITE ? dynamicWhite : dynamicBlack;

  const { topAdvantage, bottomAdvantage } = getPlayerAdvantages(
    dynamicWhite?.capturedPieces,
    dynamicBlack?.capturedPieces,
    topColor,
  );

  const currentTurnStr = activeGame?.fen.split(" ")[1];
  const isTopActive = topColor === currentTurnStr;
  const isBottomActive = bottomColor === currentTurnStr;
  const gameIsActive =
    activeGame?.status === GameStatus.IN_PROGRESS && !isViewingHistory;

  const topClock = useMemo(
    () => (
      <ClockProvider isRunning={isTopActive && gameIsActive}>
        <Clock
          timeMs={topPlayer?.timeLeftMs ?? 0}
          isRunning={isTopActive && gameIsActive}
          isWhite={topColor === PlayerColor.WHITE}
        />
      </ClockProvider>
    ),
    [isTopActive, gameIsActive, topPlayer?.timeLeftMs, topColor],
  );

  const bottomClock = useMemo(
    () => (
      <ClockProvider isRunning={isBottomActive && gameIsActive}>
        <Clock
          timeMs={bottomPlayer?.timeLeftMs ?? 0}
          isRunning={isBottomActive && gameIsActive}
          isWhite={bottomColor === PlayerColor.WHITE}
        />
      </ClockProvider>
    ),
    [isBottomActive, gameIsActive, bottomPlayer?.timeLeftMs, bottomColor],
  );

  if (
    !activeGame ||
    activeGame.gameId !== gameId ||
    !dynamicWhite ||
    !dynamicBlack
  ) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <span className="text-6xl drop-shadow-lg select-none">♟</span>
          <p className="text-zinc-400 font-mono text-sm font-semibold tracking-widest uppercase">
            Loading Game...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] mt-2 flex items-center justify-center">
      <div className="flex gap-4 items-start w-full max-w-5xl">
        <ClockProvider isRunning={gameIsActive}>
          <div className="flex flex-col gap-2 min-w-0 flex-1 max-w-140">
            <PlayerArea
              player={topPlayer!}
              color={topColor}
              isActive={isTopActive && gameIsActive}
              materialAdvantage={topAdvantage}
              position="top"
              clock={topClock}
            />

            <ActiveBoard
              activeGame={activeGame!}
              isPlayer={isPlayer}
              isWhite={isWhite}
              lastMoveRejectedReason={lastMoveRejectedReason}
              gameOver={gameOver}
              userId={user.id}
              currentFen={currentFen}
              isViewingHistory={isViewingHistory}
            />

            <PlayerArea
              player={bottomPlayer!}
              color={bottomColor}
              isActive={isBottomActive && gameIsActive}
              materialAdvantage={bottomAdvantage}
              position="bottom"
              clock={bottomClock}
            />
          </div>
        </ClockProvider>

        <GameSidebar
          activeGame={activeGame!}
          isPlayer={isPlayer}
          setSpectatorFlipped={setSpectatorFlipped}
          currentMoveIndex={currentMoveIndex}
          onMoveClick={handleMoveClick}
          gameOver={gameOver}
        />
      </div>
    </div>
  );
}
