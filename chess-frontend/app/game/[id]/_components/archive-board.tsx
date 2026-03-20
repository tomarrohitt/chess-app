"use client";

import { useState } from "react";
import { Chessboard } from "react-chessboard";
import { User } from "@/types/auth";
import { COLOR, DRAW_OFFER, GameStatus, PLAYER_COLOR } from "@/types/chess";
import { PlayerArea } from "./player-area";
import { MoveList } from "./move-list";
import { getPlayerAdvantages, getCapturedPieces } from "./advantage";
import { sharedBoardOptions } from "./board-theme";
import { useTimeline } from "@/hooks/use-timeline";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation";
import { NewGame } from "./new-game";
import { useSocket } from "@/store/socket-provider";
import { useGameStore } from "@/store/use-game-store";
import { RematchToast } from "./rematch-toast";
import { useGameAudio } from "@/hooks/use-game-audio";
import { getTimesAtMove } from "./time-utils";

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

  const { offerRematch } = useSocket();
  const { rematchOffer, rematchOfferSent } = useGameStore();

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
    <div className="min-h-screen flex items-center justify-center p-4">
      {rematchOffer && <RematchToast rematchOffer={rematchOffer} />}
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

        <div className="flex flex-col justify-center items-center">
          <div className="w-80 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/50">
              <span className="text-zinc-200 font-medium">Archive View</span>
              <button
                onClick={() => setIsFlipped((prev) => !prev)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition-colors text-sm"
              >
                Flip Board
              </button>
            </div>

            <div className="flex-1 flex flex-col ">
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

              <div className="p-4 border-t border-zinc-800/50 flex gap-2">
                <div className="flex-1">
                  <NewGame timeControl={gameData.timeControl} />
                </div>
                {isPlayer && !rematchOfferSent && !rematchOffer && (
                  <button
                    onClick={() =>
                      offerRematch(gameData.id, gameData.timeControl)
                    }
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all"
                  >
                    Rematch
                  </button>
                )}
                {isPlayer && rematchOfferSent === DRAW_OFFER.SENT && (
                  <button
                    disabled
                    className="flex-1 py-3 bg-zinc-600 text-zinc-300 font-bold rounded-xl shadow-lg cursor-not-allowed"
                  >
                    Sent...
                  </button>
                )}
                {isPlayer && rematchOfferSent === DRAW_OFFER.DECLINE && (
                  <button
                    disabled
                    className="flex-1 py-3 bg-rose-950 text-rose-400 font-bold rounded-xl shadow-lg cursor-not-allowed"
                  >
                    Declined
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden p-4">
            <MoveList
              pgn={gameData.pgn}
              timeControl={gameData.timeControl}
              currentMoveIndex={currentMoveIndex}
              onMoveClick={setCurrentMoveIndex}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
