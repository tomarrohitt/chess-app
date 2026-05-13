"use client";

import { memo } from "react";
import { MoveList } from "./move-list";
import { ActiveGame, GameOverState } from "@/types/chess";
import { NewGame } from "./new-game";
import { IncomingDrawOffer } from "./incoming-draw-offer";
import { ActiveGameControls } from "./active-game-controls";
import { RematchControls } from "./rematch-controls";
import { FlipButton } from "./flip-button";
import { GameChat } from "./game-chat";
import { useGameNavigation } from "./use-game-navigation";
import { useGameUIStore } from "./use-game-ui-store";
import { useTimeline } from "@/hooks/use-timeline";

interface GameSidebarProps {
  activeGame: ActiveGame;
  isPlayer: boolean;
  gameOver: GameOverState | null;
}

export const GameSidebar = memo(function GameSidebar({
  activeGame,
  isPlayer,
  gameOver,
}: GameSidebarProps) {
  const timeline = useTimeline(activeGame.pgn);
  const latestIndex = timeline.history.length - 1;

  const { currentMoveIndex, handleMoveClick } = useGameNavigation(latestIndex);

  const setSpectatorFlipped = useGameUIStore(
    (s) => s.actions.setSpectatorFlipped,
  );

  return (
    <div className="flex flex-col justify-center items-center relative">
      {!isPlayer && (
        <FlipButton onFlip={() => setSpectatorFlipped((p) => !p)} />
      )}

      <div className="flex-1 flex flex-col overflow-hidden p-4">
        <MoveList
          pgn={activeGame.pgn}
          timeControl={activeGame.timeControl}
          currentMoveIndex={currentMoveIndex}
          onMoveClick={handleMoveClick}
          live
        />
      </div>

      <div className="flex flex-col gap-1.5 p-3 border-t border-zinc-800/40 w-full">
        {isPlayer && !gameOver && (
          <ActiveGameControls gameId={activeGame.gameId} isPlayer={isPlayer} />
        )}
        <IncomingDrawOffer gameId={activeGame.gameId} isPlayer={isPlayer} />
        {gameOver && (
          <div className="flex gap-4 w-full mt-4">
            <NewGame timeControl={activeGame.timeControl} />
            <RematchControls
              gameId={activeGame.gameId}
              timeControl={activeGame.timeControl}
              isPlayer={isPlayer}
            />
          </div>
        )}
      </div>

      <GameChat gameId={activeGame.gameId} isPlayer={isPlayer} />
    </div>
  );
});
