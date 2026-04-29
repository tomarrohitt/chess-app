"use client";

import { PlayerCard } from "./player-card";
import { CapturedPieces } from "./captured-pieces";
import { PlayerColor } from "@/types/chess";
import { GameStateUser } from "@/types/player";
import { memo } from "react";

interface PlayerAreaProps {
  player: GameStateUser;
  color: PlayerColor;
  isActive: boolean;
  materialAdvantage: number;
  position: "top" | "bottom";
  clock: React.ReactNode;
}

export const PlayerArea = memo(function PlayerArea({
  player,
  color,
  isActive,
  materialAdvantage,
  position,
  clock,
}: PlayerAreaProps) {
  const card = (
    <PlayerCard
      player={player}
      color={color}
      isActive={isActive}
      pieces={
        <CapturedPieces
          capturedPieces={player.capturedPieces}
          color={color}
          materialAdvantage={materialAdvantage}
          position={position}
        />
      }
      position={position}
      clock={clock}
    />
  );

  return <div className="flex flex-col gap-1">{card}</div>;
});
