"use client";

import { memo } from "react";
import { useGameStore } from "@/store/use-game-store";
import { useGameContext } from "./use-game-context";
import { useTimeline } from "@/hooks/use-timeline";
import { useCapturedPieces } from "./use-captured-piece";
import { useGameUIStore } from "./use-game-ui-store";
import { getPlayerAdvantages } from "./advantage";
import { PlayerArea } from "./player-area";
import { ActiveBoard } from "./active-board";
import { PlayerColor, GameStatus } from "@/types/chess";

interface BoardColumnProps {
  userId: string;
}

export const BoardColumn = memo(function BoardColumn({
  userId,
}: BoardColumnProps) {
  const activeGame = useGameStore((s) => s.activeGame);

  const viewingIndex = useGameUIStore((s) => s.viewingIndex);

  const { topColor, bottomColor, topPlayer, bottomPlayer } =
    useGameContext(userId);

  const timeline = useTimeline(activeGame?.pgn, activeGame?.timeControl);
  const latestIndex = timeline.history.length - 1;
  const safeIndex = Math.max(
    0,
    Math.min((viewingIndex ?? latestIndex) + 1, timeline.fens.length - 1),
  );

  const currentFen = timeline.fens[safeIndex] ?? activeGame?.fen ?? "";
  const isViewingHistory = viewingIndex !== null;

  const captured = useCapturedPieces(currentFen);

  const gameIsActive = activeGame?.status === GameStatus.IN_PROGRESS;
  const atLatest = viewingIndex === null;

  const historicalTimes =
    viewingIndex === null || viewingIndex === latestIndex
      ? {
          whiteTimeLeftMs: activeGame?.white.timeLeftMs ?? 0,
          blackTimeLeftMs: activeGame?.black.timeLeftMs ?? 0,
        }
      : timeline.times[safeIndex] || {
          whiteTimeLeftMs: activeGame?.white.timeLeftMs ?? 0,
          blackTimeLeftMs: activeGame?.black.timeLeftMs ?? 0,
        };

  const isWhiteTurn = activeGame?.fen?.split(" ")[1] === "w";
  const isTopActive =
    (topColor === PlayerColor.WHITE ? isWhiteTurn : !isWhiteTurn) &&
    gameIsActive &&
    atLatest;
  const isBottomActive = !isTopActive && gameIsActive && atLatest;

  const topTimeMs =
    topColor === PlayerColor.WHITE
      ? historicalTimes.whiteTimeLeftMs
      : historicalTimes.blackTimeLeftMs;
  const bottomTimeMs =
    bottomColor === PlayerColor.WHITE
      ? historicalTimes.whiteTimeLeftMs
      : historicalTimes.blackTimeLeftMs;

  const { topAdvantage, bottomAdvantage } = getPlayerAdvantages(
    captured.capturedByWhite,
    captured.capturedByBlack,
    topColor,
  );

  if (!activeGame || !topPlayer || !bottomPlayer) return null;

  return (
    <div className="flex flex-col gap-2 min-w-0 flex-1 max-w-140">
      <PlayerArea
        player={topPlayer}
        color={topColor}
        isActive={isTopActive}
        materialAdvantage={topAdvantage}
        position="top"
        timeMs={topTimeMs}
        clockRunning={isTopActive}
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
      />
    </div>
  );
});
