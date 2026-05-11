"use client";

import { useEffect, useMemo } from "react";
import { useGameStore } from "@/store/use-game-store";
import { useSocket } from "@/store/socket-provider";
import { useGameAudio } from "@/hooks/use-game-audio";
import { useTimeline } from "@/hooks/use-timeline";

import { User } from "@/types/auth";
import { PlayerColor, GameStatus } from "@/types/chess";
import { useGameUIStore } from "./use-game-ui-store";
import { GameSidebar } from "./game-sidebar";
import { PlayerArea } from "./player-area";
import { ActiveBoard } from "./active-board";
import { CapturedPieces } from "./captured-pieces";
import { useCapturedPieces } from "./use-captured-piece";

interface GameboardProps {
  gameId: string;
  user: User;
}

export function Gameboard({ gameId, user }: GameboardProps) {
  const { spectateGame, leaveSpectator } = useSocket();

  useEffect(() => {
    spectateGame(gameId);
    return () => leaveSpectator(gameId);
  }, [gameId]);

  const activeGame = useGameStore((s) => s.activeGame);
  const gameOver = useGameStore((s) => s.gameOver);
  const rematchOffer = useGameStore((s) => s.rematchOffer);

  const timeline = useTimeline(activeGame?.pgn);
  const viewingIndex = useGameUIStore((s) => s.viewingIndex);
  const latestIndex = timeline.history.length - 1;

  const safeIndex = Math.max(
    0,
    Math.min((viewingIndex ?? latestIndex) + 1, timeline.fens.length - 1),
  );

  const currentFen = timeline.fens[safeIndex] ?? activeGame?.fen ?? "";
  const isViewingHistory = viewingIndex !== null;

  const isWhite = user.id === activeGame?.white.id;
  const isBlack = user.id === activeGame?.black.id;
  const isPlayer = isWhite || isBlack;

  useGameAudio({
    history: timeline.history,
    currentMoveIndex: viewingIndex ?? latestIndex,
    isPlayer,
    isWhite,
    userId: user.id,
    isArchive: false,
    rematchOffer,
  });

  const capturedPieces = useCapturedPieces(currentFen);

  const { topAdvantage, bottomAdvantage } = useMemo(() => {
    const pieceValues: Record<string, number> = {
      p: 1,
      n: 3,
      b: 3,
      r: 5,
      q: 9,
    };
    let whiteScore = 0;
    let blackScore = 0;
    capturedPieces.capturedByWhite.forEach((p) => {
      whiteScore += pieceValues[p.toLowerCase()] || 0;
    });
    capturedPieces.capturedByBlack.forEach((p) => {
      blackScore += pieceValues[p.toLowerCase()] || 0;
    });

    const whiteAdvantage = Math.max(0, whiteScore - blackScore);
    const blackAdvantage = Math.max(0, blackScore - whiteScore);

    return {
      topAdvantage: isBlack ? whiteAdvantage : blackAdvantage,
      bottomAdvantage: isBlack ? blackAdvantage : whiteAdvantage,
    };
  }, [capturedPieces, isBlack]);

  if (!activeGame) return null;

  const bottomColor = isBlack ? PlayerColor.BLACK : PlayerColor.WHITE;
  const topColor = isBlack ? PlayerColor.WHITE : PlayerColor.BLACK;

  const bottomPlayer = isBlack ? activeGame.black : activeGame.white;
  const topPlayer = isBlack ? activeGame.white : activeGame.black;

  const isBottomActive =
    activeGame.turn === bottomColor &&
    activeGame.status === GameStatus.IN_PROGRESS &&
    !gameOver;

  const isTopActive =
    activeGame.turn === topColor &&
    activeGame.status === GameStatus.IN_PROGRESS &&
    !gameOver;

  const bottomTimeMs = bottomPlayer.timeLeftMs;
  const topTimeMs = topPlayer.timeLeftMs;

  return (
    <div className="min-h-[calc(100vh-80px)] mt-2 flex items-center justify-center">
      <div className="flex gap-4 items-start w-full max-w-5xl">
        <div className="flex flex-col gap-2 min-w-0 flex-1 max-w-140">
          <PlayerArea
            player={topPlayer}
            color={topColor}
            isActive={isTopActive}
            materialAdvantage={topAdvantage}
            position="top"
            timeMs={topTimeMs}
            clockRunning={isTopActive}
            pieces={
              <CapturedPieces
                capturedPieces={
                  topColor === PlayerColor.WHITE
                    ? capturedPieces.capturedByWhite
                    : capturedPieces.capturedByBlack
                }
                color={topColor}
                materialAdvantage={topAdvantage}
                position="top"
              />
            }
          />

          <ActiveBoard
            currentFen={currentFen}
            isViewingHistory={isViewingHistory}
          />

          <PlayerArea
            player={bottomPlayer}
            color={bottomColor}
            isActive={isBottomActive}
            materialAdvantage={bottomAdvantage}
            position="bottom"
            timeMs={bottomTimeMs}
            clockRunning={isBottomActive}
            pieces={
              <CapturedPieces
                capturedPieces={
                  bottomColor === PlayerColor.WHITE
                    ? capturedPieces.capturedByWhite
                    : capturedPieces.capturedByBlack
                }
                color={bottomColor}
                materialAdvantage={bottomAdvantage}
                position="bottom"
              />
            }
          />
        </div>

        <GameSidebar
          activeGame={activeGame}
          isPlayer={isPlayer}
          gameOver={gameOver}
        />
      </div>
    </div>
  );
}
