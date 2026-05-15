"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { User } from "@/types/auth";
import { GameStatus, PlayerColor } from "@/types/chess";
import { PlayerArea } from "./player-area";
import { MoveList } from "./move-list";
import { getPlayerAdvantages } from "./advantage";
import { useTimeline } from "@/hooks/use-timeline";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation";
import { NewGame } from "./new-game";
import { useGameStore } from "@/store/use-game-store";
import { useGameAudio } from "@/hooks/use-game-audio";
import { RematchControls } from "./rematch-controls";
import { CapturedPieces } from "./captured-pieces";

import Chessground from "@bezalel6/react-chessground";
import type { Config } from "chessground/config";
import { sharedBoardConfig } from "./board-theme";
import Image from "next/image";

export interface GamePlayer {
  id: string;
  username: string;
  image: string;
  currentRating: number;
  rating: number;
  diff: number;
  timeLeftMs: number;
  capturedPieces: string[];
}

export interface InitialGameData {
  id: string;
  status: GameStatus;
  result: string;
  winnerId: string | null;
  timeControl: string;
  createdAt: string;
  pgn: string;
  finalFen: string;
  moveTimes: number[];
  whiteTimeLeftMs: number;
  blackTimeLeftMs: number;
  white: GamePlayer;
  black: GamePlayer;
}

interface ArchiveBoardProps {
  gameData: InitialGameData;
  user: User;
}

const EMPTY_CAPTURED = {
  capturedByWhite: [],
  capturedByBlack: [],
};

export const ArchiveBoard = memo(function ArchiveBoard({
  gameData,
  user,
}: ArchiveBoardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const rematchOffer = useGameStore((s) => s.rematchOffer);

  const timeline = useTimeline(gameData.pgn, gameData.timeControl);
  const latestIndex = timeline.history.length - 1;

  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(latestIndex);
  const [prevLatestIndex, setPrevLatestIndex] = useState<number>(latestIndex);

  if (latestIndex !== prevLatestIndex) {
    setPrevLatestIndex(latestIndex);
    setCurrentMoveIndex(latestIndex);
  }

  const isPlayer =
    user.id === gameData.white.id || user.id === gameData.black.id;
  const playerIsWhite = user.id === gameData.white.id;
  const isViewingWhite = isFlipped ? !playerIsWhite : playerIsWhite;

  const topColor = isViewingWhite ? PlayerColor.BLACK : PlayerColor.WHITE;
  const bottomColor = isViewingWhite ? PlayerColor.WHITE : PlayerColor.BLACK;

  const handleArrowLeft = useCallback(
    () => setCurrentMoveIndex((prev) => Math.max(-1, prev - 1)),
    [],
  );
  const handleArrowRight = useCallback(
    () => setCurrentMoveIndex((prev) => Math.min(latestIndex, prev + 1)),
    [latestIndex],
  );
  const handleArrowUp = useCallback(() => setCurrentMoveIndex(-1), []);
  const handleArrowDown = useCallback(
    () => setCurrentMoveIndex(latestIndex),
    [latestIndex],
  );
  const handleMoveClick = useCallback(
    (index: number) => setCurrentMoveIndex(index),
    [],
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
    isWhite: playerIsWhite,
    userId: user.id,
    isArchive: true,
    rematchOffer,
  });

  const safeIndex = Math.max(
    0,
    Math.min(currentMoveIndex + 1, timeline.fens.length - 1),
  );
  const currentFen = timeline.fens[safeIndex];

  const capturedPieces = timeline.captured[safeIndex] || EMPTY_CAPTURED;
  const historicalTimes =
    currentMoveIndex === latestIndex
      ? {
          whiteTimeLeftMs: gameData.white.timeLeftMs,
          blackTimeLeftMs: gameData.black.timeLeftMs,
        }
      : timeline.times[safeIndex] || {
          whiteTimeLeftMs: gameData.white.timeLeftMs,
          blackTimeLeftMs: gameData.black.timeLeftMs,
        };

  const cgConfig = useMemo(
    (): Partial<Config> => ({
      ...sharedBoardConfig,
      fen: currentFen,
      orientation: isViewingWhite ? "white" : "black",
      movable: { free: false, color: undefined },
      draggable: { enabled: false },
      drawable: { enabled: true, eraseOnClick: true },
    }),
    [currentFen, isViewingWhite],
  );

  const dynamicWhite = useMemo(
    () => ({
      ...gameData.white,
      capturedPieces: capturedPieces.capturedByWhite,
      timeLeftMs: historicalTimes.whiteTimeLeftMs,
    }),
    [
      gameData.white,
      capturedPieces.capturedByWhite,
      historicalTimes.whiteTimeLeftMs,
    ],
  );

  const dynamicBlack = useMemo(
    () => ({
      ...gameData.black,
      capturedPieces: capturedPieces.capturedByBlack,
      timeLeftMs: historicalTimes.blackTimeLeftMs,
    }),
    [
      gameData.black,
      capturedPieces.capturedByBlack,
      historicalTimes.blackTimeLeftMs,
    ],
  );

  const topPlayer =
    topColor === PlayerColor.WHITE ? dynamicWhite : dynamicBlack;
  const bottomPlayer =
    bottomColor === PlayerColor.WHITE ? dynamicWhite : dynamicBlack;

  const { topAdvantage, bottomAdvantage } = getPlayerAdvantages(
    dynamicWhite.capturedPieces,
    dynamicBlack.capturedPieces,
    topColor,
  );

  return (
    <div className="min-h-[calc(100vh-80px)] mt-2 flex items-center justify-center">
      <div className="flex gap-4 items-start w-full max-w-5xl">
        <div className="flex flex-col gap-2 min-w-0 flex-1 max-w-140">
          <PlayerArea
            player={topPlayer}
            color={topColor}
            isActive={false}
            materialAdvantage={topAdvantage}
            position="top"
            timeMs={topPlayer.timeLeftMs}
            clockRunning={false}
            pieces={
              <CapturedPieces
                capturedPieces={topPlayer.capturedPieces}
                color={topColor}
                materialAdvantage={topAdvantage}
                position="top"
              />
            }
          />

          <div style={{ width: 500, height: 500 }}>
            <Chessground width={500} height={500} {...cgConfig} />
          </div>

          <PlayerArea
            player={bottomPlayer}
            color={bottomColor}
            isActive={false}
            materialAdvantage={bottomAdvantage}
            position="bottom"
            timeMs={bottomPlayer.timeLeftMs}
            clockRunning={false}
            pieces={
              <CapturedPieces
                capturedPieces={bottomPlayer.capturedPieces}
                color={bottomColor}
                materialAdvantage={bottomAdvantage}
                position="bottom"
              />
            }
          />
        </div>

        <div className="flex flex-col justify-center items-start relative">
          <button
            onClick={() => setIsFlipped((p) => !p)}
            className="absolute top-5 -left-16 cursor-pointer hover:scale-110 transition-transform p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
          >
            <Image src="/flip.svg" alt="Flip board" height={20} width={20} />
          </button>{" "}
          <div className="flex-1 flex flex-col overflow-hidden p-4">
            <MoveList
              pgn={gameData.pgn}
              timeControl={gameData.timeControl}
              currentMoveIndex={currentMoveIndex}
              onMoveClick={handleMoveClick}
            />
          </div>
          <div className="flex gap-4 w-full mt-4">
            <NewGame timeControl={gameData.timeControl} />
            <RematchControls
              gameId={gameData.id}
              timeControl={gameData.timeControl}
              isPlayer={isPlayer}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
