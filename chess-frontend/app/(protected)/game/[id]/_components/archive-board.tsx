"use client";

import { useState } from "react";
import { Chessboard } from "react-chessboard";
import { User } from "@/types/auth";
import { COLOR, GameStatus, PLAYER_COLOR } from "@/types/chess";
import { PlayerArea } from "./player-area";
import { MoveList } from "./move-list";
import { getPlayerAdvantages, getCapturedPieces } from "./advantage";
import { sharedBoardOptions } from "./board-theme";
import { useTimeline } from "@/hooks/use-timeline";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation";
import { NewGame } from "./new-game";
import { useGameStore } from "@/store/use-game-store";
import { useGameAudio } from "@/hooks/use-game-audio";
import { getTimesAtMove } from "./time-utils";
import { RematchControls } from "./rematch-controls";
import Image from "next/image";
import { FlipButton } from "./flip-button";

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

export function ArchiveBoard({ gameData, user }: ArchiveBoardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const isPlayer =
    user.id === gameData.white.id || user.id === gameData.black.id;
  const playerIsWhite = user.id === gameData.white.id;
  const isViewingWhite = isFlipped ? !playerIsWhite : playerIsWhite;

  const topColor = isViewingWhite ? PLAYER_COLOR.BLACK : PLAYER_COLOR.WHITE;
  const bottomColor = isViewingWhite ? PLAYER_COLOR.WHITE : PLAYER_COLOR.BLACK;

  const { rematchOffer } = useGameStore();

  const timeline = useTimeline(gameData.pgn);

  const [currentMoveIndex, setCurrentMoveIndex] = useState(
    timeline.history.length - 1,
  );

  useKeyboardNavigation({
    onArrowLeft: () => setCurrentMoveIndex((prev) => Math.max(-1, prev - 1)),
    onArrowRight: () =>
      setCurrentMoveIndex((prev) =>
        Math.min(timeline.history.length - 1, prev + 1),
      ),
    onArrowUp: () => setCurrentMoveIndex(-1),
    onArrowDown: () => setCurrentMoveIndex(timeline.history.length - 1),
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

  const currentFen = timeline.fens[currentMoveIndex + 1];
  const boardOptions = {
    position: currentFen,
    boardOrientation: isViewingWhite ? COLOR.WHITE : COLOR.BLACK,
    allowDragging: false,
    allowDrawingArrows: true,
    clearArrowsOnPositionChange: true,
    ...sharedBoardOptions,
  };

  const latestIndex = timeline.history.length - 1;

  const historicalTimes =
    currentMoveIndex !== latestIndex
      ? getTimesAtMove(gameData.pgn, gameData.timeControl, currentMoveIndex)
      : {
          whiteTimeLeftMs: gameData.white.timeLeftMs,
          blackTimeLeftMs: gameData.black.timeLeftMs,
        };

  const { capturedByWhite, capturedByBlack } = getCapturedPieces(currentFen);
  const dynamicWhite = {
    ...gameData.white,
    capturedPieces: capturedByWhite,
    timeLeftMs: historicalTimes.whiteTimeLeftMs,
  };
  const dynamicBlack = {
    ...gameData.black,
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
          />

          <div style={{ width: 500, height: 500 }}>
            <Chessboard options={boardOptions} />
          </div>

          <PlayerArea
            player={bottomPlayer}
            color={bottomColor}
            isActive={false}
            materialAdvantage={bottomAdvantage}
            position="bottom"
          />
        </div>

        <div className="flex flex-col justify-center items-start relative">
          <FlipButton isPlayer={!isPlayer} setSpectatorFlipped={setIsFlipped} />
          <div className="flex-1 flex flex-col overflow-hidden p-4">
            <MoveList
              pgn={gameData.pgn}
              timeControl={gameData.timeControl}
              currentMoveIndex={currentMoveIndex}
              onMoveClick={setCurrentMoveIndex}
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
}
