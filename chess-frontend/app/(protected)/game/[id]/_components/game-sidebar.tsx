"use client";

import { MoveList } from "./move-list";
import { ActiveGame, GameOverState } from "@/types/chess";
import { Dispatch, SetStateAction } from "react";
import { NewGame } from "./new-game";
import { IncomingDrawOffer } from "./incoming-draw-offer";
import { ActiveGameControls } from "./active-game-controls";
import { RematchControls } from "./rematch-controls";
import { FlipButton } from "./flip-button";

interface GameSidebarProps {
  activeGame: ActiveGame;
  isPlayer: boolean;
  setSpectatorFlipped: Dispatch<SetStateAction<boolean>>;
  currentMoveIndex?: number;
  onMoveClick?: (index: number) => void;
  gameOver: GameOverState | null;
}

export function GameSidebar({
  activeGame,
  isPlayer,
  setSpectatorFlipped,
  currentMoveIndex,
  onMoveClick,
  gameOver,
}: GameSidebarProps) {
  if (!activeGame) return null;

  return (
    <div className="flex flex-col justify-center items-center relative">
      <FlipButton
        isPlayer={isPlayer}
        setSpectatorFlipped={setSpectatorFlipped}
      />
      <div className="flex-1 flex flex-col overflow-hidden p-4">
        <MoveList
          pgn={activeGame.pgn}
          timeControl={activeGame.timeControl}
          currentMoveIndex={currentMoveIndex}
          onMoveClick={onMoveClick}
          live={true}
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
    </div>
  );
}
