"use client";
import { useEffect, useState } from "react";
import { useGameStore } from "@/store/use-game-store";
import { User } from "@/types/auth";

import { GameStatus, PLAYER_COLOR } from "@/types/chess";
import { useSocket } from "@/store/socket-provider";
import { GameSidebar } from "./game-sidebar";
import { ActiveBoard } from "./active-board";
import { PlayerArea } from "./player-area";
import { getPlayerAdvantages, getCapturedPieces } from "./advantage";
import { useTimeline } from "@/hooks/use-timeline";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation";
import { useGameAudio } from "@/hooks/use-game-audio";
import { getTimesAtMove } from "./time-utils";

interface GameboardProps {
  gameId: string;
  user: User;
}

export function Gameboard({ gameId, user }: GameboardProps) {
  const {
    activeGame: storeActiveGame,
    gameOver: storeGameOver,
    lastMoveRejectedReason,
    drawOffer,
    rematchOffer,
  } = useGameStore((s) => s);

  const [cachedGame, setCachedGame] = useState(storeActiveGame);
  const [cachedGameOver, setCachedGameOver] = useState(storeGameOver);

  useEffect(() => {
    if (storeActiveGame && storeActiveGame.gameId === gameId) {
      setCachedGame(storeActiveGame);
      setCachedGameOver(storeGameOver);
    }
  }, [storeActiveGame, storeGameOver, gameId]);

  const activeGame =
    storeActiveGame?.gameId === gameId ? storeActiveGame : cachedGame;
  const gameOver =
    storeActiveGame?.gameId === gameId ? storeGameOver : cachedGameOver;
  const { spectateGame, leaveSpectator } = useSocket();

  const [spectatorFlipped, setSpectatorFlipped] = useState(false);

  const isPlayer =
    user.id === activeGame?.white.id || user.id === activeGame?.black.id;
  const isWhite = isPlayer
    ? user.id === activeGame?.white.id
    : !spectatorFlipped;

  const topColor = isWhite ? PLAYER_COLOR.BLACK : PLAYER_COLOR.WHITE;
  const bottomColor = isWhite ? PLAYER_COLOR.WHITE : PLAYER_COLOR.BLACK;

  const timeline = useTimeline(activeGame?.pgn);

  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const latestIndex = timeline.history.length - 1;

  useKeyboardNavigation({
    onArrowLeft: () => {
      setViewingIndex((prev) => {
        const currentIndex = prev !== null ? prev : latestIndex;
        return Math.max(-1, currentIndex - 1);
      });
    },
    onArrowRight: () => {
      setViewingIndex((prev) => {
        const currentIndex = prev !== null ? prev : latestIndex;
        const nextIndex = Math.min(latestIndex, currentIndex + 1);
        return nextIndex === latestIndex ? null : nextIndex;
      });
    },
    onArrowUp: () => setViewingIndex(-1),
    onArrowDown: () => setViewingIndex(null),
  });

  const handleMoveClick = (index: number) => {
    setViewingIndex(index === latestIndex ? null : index);
  };

  const currentMoveIndex = viewingIndex !== null ? viewingIndex : latestIndex;

  useGameAudio({
    history: timeline.history,
    currentMoveIndex,
    isPlayer,
    isWhite,
    userId: user.id,
    gameOver,
    gameId: activeGame?.gameId,
    drawOffer,
    rematchOffer,
  });

  useEffect(() => {
    spectateGame(gameId);
    return () => {
      leaveSpectator(gameId);
    };
  }, [gameId, spectateGame, leaveSpectator]);

  if (!activeGame || activeGame.gameId !== gameId) {
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

  const currentFen = timeline.fens[currentMoveIndex + 1] || activeGame.fen;
  const isViewingHistory = viewingIndex !== null;

  const historicalTimes =
    isViewingHistory && viewingIndex !== latestIndex
      ? getTimesAtMove(activeGame.pgn, activeGame.timeControl, currentMoveIndex)
      : {
          whiteTimeLeftMs: activeGame.white.timeLeftMs,
          blackTimeLeftMs: activeGame.black.timeLeftMs,
        };

  const { capturedByWhite, capturedByBlack } = getCapturedPieces(currentFen);
  const dynamicWhite = {
    ...activeGame.white,
    capturedPieces: capturedByWhite,
    timeLeftMs: historicalTimes.whiteTimeLeftMs,
  };
  const dynamicBlack = {
    ...activeGame.black,
    capturedPieces: capturedByBlack,
    timeLeftMs: historicalTimes.blackTimeLeftMs,
  };

  const topPlayer =
    topColor === PLAYER_COLOR.WHITE ? dynamicWhite : dynamicBlack;
  const bottomPlayer =
    bottomColor === PLAYER_COLOR.WHITE ? dynamicWhite : dynamicBlack;

  const { topAdvantage, bottomAdvantage } = getPlayerAdvantages(
    dynamicWhite.capturedPieces,
    dynamicBlack.capturedPieces,
    topColor,
  );

  const currentTurnStr = activeGame.fen.split(" ")[1];
  const isTopActive = topColor === currentTurnStr;
  const isBottomActive = bottomColor === currentTurnStr;

  return (
    <div className="min-h-[calc(100vh-80px)] mt-2 flex items-center justify-center">
      <div className="flex gap-4 items-start w-full max-w-5xl">
        <div className="flex flex-col gap-2 min-w-0 flex-1 max-w-140">
          <PlayerArea
            player={topPlayer!}
            color={topColor}
            isActive={
              isTopActive &&
              activeGame.status === GameStatus.IN_PROGRESS &&
              !isViewingHistory
            }
            materialAdvantage={topAdvantage}
            position="top"
          />

          <ActiveBoard
            activeGame={activeGame}
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
            isActive={
              isBottomActive &&
              activeGame.status === GameStatus.IN_PROGRESS &&
              !isViewingHistory
            }
            materialAdvantage={bottomAdvantage}
            position="bottom"
          />
        </div>

        <GameSidebar
          activeGame={activeGame}
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
