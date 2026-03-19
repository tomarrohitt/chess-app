"use client";

import { useState, useEffect, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { User } from "@/types/auth";
import { COLOR, GameStatus, PLAYER_COLOR } from "@/types/chess";
import { PlayerArea } from "./player-area";
import { MoveList } from "./move-list";
import { getPlayerAdvantages, getCapturedPieces } from "./advantage";
import { playAudio, getMoveSoundFile } from "@/lib/audio";
import { sharedBoardOptions } from "./board-theme";
import { useTimeline } from "@/hooks/use-timeline";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation";

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

  const isWhite = isPlayer
    ? isFlipped
      ? !playerIsWhite
      : playerIsWhite
    : !isFlipped;

  const topColor = isWhite ? PLAYER_COLOR.BLACK : PLAYER_COLOR.WHITE;
  const bottomColor = isWhite ? PLAYER_COLOR.WHITE : PLAYER_COLOR.BLACK;

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

  const prevMoveIndex = useRef(currentMoveIndex);
  useEffect(() => {
    if (currentMoveIndex !== prevMoveIndex.current) {
      let soundFile = "/move-self.mp3";

      if (currentMoveIndex >= 0) {
        const currentMove = timeline.history[currentMoveIndex];

        const isWhiteMove = (currentMoveIndex + 1) % 2 !== 0;
        const isMyMove = isPlayer && isWhiteMove === playerIsWhite;

        soundFile = getMoveSoundFile(currentMove, isMyMove, !isPlayer);

        if (currentMoveIndex === timeline.history.length - 1) {
          soundFile = "/game-end.mp3";
        }
      }

      playAudio(soundFile);
    }

    prevMoveIndex.current = currentMoveIndex;
  }, [
    currentMoveIndex,
    timeline.history,
    gameData.winnerId,
    user.id,
    isPlayer,
    playerIsWhite,
  ]);

  const currentFen = timeline.fens[currentMoveIndex + 1];
  const boardOptions = {
    position: currentFen,
    boardOrientation: isWhite ? COLOR.WHITE : COLOR.BLACK,
    allowDragging: false,
    allowDrawingArrows: true,
    clearArrowsOnPositionChange: true,
    ...sharedBoardOptions,
  };

  const { capturedByWhite, capturedByBlack } = getCapturedPieces(currentFen);
  const dynamicWhite = { ...gameData.white, capturedPieces: capturedByWhite };
  const dynamicBlack = { ...gameData.black, capturedPieces: capturedByBlack };

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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="flex gap-4 items-start w-full max-w-5xl">
        <div className="flex flex-col gap-2 min-w-0 flex-1 max-w-140">
          <PlayerArea
            player={topPlayer}
            color={topColor}
            isActive={false}
            materialAdvantage={topAdvantage}
            position="top"
          />

          <div className="relative">
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

        <div className="w-80 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col overflow-hidden h-150">
          <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/50">
            <span className="text-zinc-200 font-medium">Archive View</span>
            <button
              onClick={() => setIsFlipped((prev) => !prev)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition-colors text-sm"
            >
              Flip Board
            </button>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-4 space-y-4 shrink-0 border-b border-zinc-800/50">
              <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                  Status
                </div>
                <div className="text-zinc-200 font-medium">
                  {gameData.status}
                </div>
              </div>
              <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                  Result
                </div>
                <div className="text-zinc-200 font-medium">
                  {gameData.result === "w"
                    ? "White Won"
                    : gameData.result === "b"
                      ? "Black Won"
                      : "Draw"}
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden min-h-0 p-4">
              <MoveList
                pgn={gameData.pgn}
                timeControl={gameData.timeControl}
                state="finished"
                currentMoveIndex={currentMoveIndex}
                onMoveClick={setCurrentMoveIndex}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
