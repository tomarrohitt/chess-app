"use client";
import { useEffect, useState, useRef } from "react";
import { useGameStore } from "@/store/use-game-store";
import { User } from "@/types/auth";

import { GameStatus, PLAYER_COLOR } from "@/types/chess";
import { useSocket } from "@/store/socket-provider";
import { LobbyClient } from "@/components/game/lobby-client";
import { GameSidebar } from "./game-sidebar";
import { ActiveBoard } from "./active-board";
import { PlayerArea } from "./player-area";
import { getPlayerAdvantages, getCapturedPieces } from "./advantage";
import { playAudio, getMoveSoundFile } from "@/lib/audio";
import { useTimeline } from "@/hooks/use-timeline";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation";

interface GameboardProps {
  gameId: string;
  user: User;
}

export function Gameboard({ gameId, user }: GameboardProps) {
  const { activeGame, gameOver, lastMoveRejectedReason, drawOffer } =
    useGameStore((s) => s);
  const { spectateGame, leaveSpectator } = useSocket();

  const [spectatorFlipped, setSpectatorFlipped] = useState(false);

  const isPlayer =
    user.id === activeGame?.white.id || user.id === activeGame?.black.id;
  const isWhite = isPlayer
    ? user.id === activeGame?.white.id
    : !spectatorFlipped;

  const topColor = isWhite ? PLAYER_COLOR.BLACK : PLAYER_COLOR.WHITE;
  const bottomColor = isWhite ? PLAYER_COLOR.WHITE : PLAYER_COLOR.BLACK;

  const opponentId = isWhite ? activeGame?.black.id : activeGame?.white.id;

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

  const prevHistoryLength = useRef(timeline.history.length);
  const prevMoveIndex = useRef(currentMoveIndex);

  useEffect(() => {
    const currentLength = timeline.history.length;
    let soundFile: string | null = null;

    if (currentLength > prevHistoryLength.current) {
      const lastMove = timeline.history[currentLength - 1];

      const isWhiteMove = currentLength % 2 !== 0;
      const isMyMove = isPlayer && isWhiteMove === isWhite;
      soundFile = getMoveSoundFile(lastMove, isMyMove, !isPlayer);
    } else if (currentMoveIndex !== prevMoveIndex.current) {
      if (currentMoveIndex >= 0) {
        const currentMove = timeline.history[currentMoveIndex];
        const isWhiteMove = (currentMoveIndex + 1) % 2 !== 0;
        const isMyMove = isPlayer && isWhiteMove === isWhite;

        soundFile = getMoveSoundFile(currentMove, isMyMove, !isPlayer);
      } else {
        soundFile = "/move-self.mp3";
      }
    }

    if (soundFile) {
      playAudio(soundFile);
    }

    prevHistoryLength.current = currentLength;
    prevMoveIndex.current = currentMoveIndex;
  }, [timeline.history, currentMoveIndex, isPlayer, isWhite]);

  const prevGameOver = useRef<boolean>(false);
  useEffect(() => {
    if (gameOver && !prevGameOver.current) {
      let soundFile = "/game-end.mp3";

      if (gameOver.winnerId === user.id) {
        soundFile = "/game-end.mp3";
      } else if (gameOver.winnerId) {
        soundFile = "/game-end.mp3";
      }

      playAudio(soundFile);
      prevGameOver.current = true;
    }
  }, [gameOver, user.id]);

  const prevGameId = useRef<string | null>(null);
  useEffect(() => {
    if (activeGame && activeGame.gameId !== prevGameId.current) {
      if (timeline.history.length === 0) {
        playAudio("/game-start.mp3");
      }
      prevGameId.current = activeGame.gameId;
    }
  }, [activeGame, timeline.history.length]);

  const prevDrawOffer = useRef<any>(null);
  useEffect(() => {
    if (drawOffer && drawOffer !== prevDrawOffer.current) {
      playAudio("/drawoffer.mp3");
    }
    prevDrawOffer.current = drawOffer;
  }, [drawOffer]);

  useEffect(() => {
    spectateGame(gameId);
    return () => {
      leaveSpectator(gameId);
    };
  }, [gameId, spectateGame, leaveSpectator]);

  if (!activeGame || activeGame.gameId !== gameId) {
    return <LobbyClient user={user} />;
  }

  const currentFen = timeline.fens[currentMoveIndex + 1] || activeGame.fen;
  const isViewingHistory = viewingIndex !== null;

  const { capturedByWhite, capturedByBlack } = getCapturedPieces(currentFen);
  const dynamicWhite = { ...activeGame.white, capturedPieces: capturedByWhite };
  const dynamicBlack = { ...activeGame.black, capturedPieces: capturedByBlack };

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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="flex gap-4 items-start w-full max-w-5xl">
        <div className="flex flex-col gap-2 min-w-0 flex-1 max-w-140">
          <PlayerArea
            player={topPlayer!}
            color={topColor}
            isActive={
              isTopActive && activeGame.status === GameStatus.IN_PROGRESS
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
              isBottomActive && activeGame.status === GameStatus.IN_PROGRESS
            }
            materialAdvantage={bottomAdvantage}
            position="bottom"
          />
        </div>

        <GameSidebar
          isPlayer={isPlayer}
          opponentId={opponentId}
          setSpectatorFlipped={setSpectatorFlipped}
          {...({
            currentMoveIndex,
            onMoveClick: handleMoveClick,
          } as any)}
        />
      </div>
    </div>
  );
}
