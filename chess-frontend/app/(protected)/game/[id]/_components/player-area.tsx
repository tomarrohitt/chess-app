"use client";

import { PlayerCard } from "./player-card";
import { CapturedPieces } from "./captured-pieces";
import { PlayerColor } from "@/types/chess";
import { GameStateUser } from "@/types/player";

interface PlayerAreaProps {
  player: GameStateUser;
  color: PlayerColor;
  isActive: boolean;
  materialAdvantage: number;
  position: "top" | "bottom";
}

export function PlayerArea({
  player,
  color,
  isActive,
  materialAdvantage,
  position,
}: PlayerAreaProps) {
  const pieces = (
    <CapturedPieces
      capturedPieces={player.capturedPieces}
      color={color}
      materialAdvantage={materialAdvantage}
      position={position}
    />
  );
  const card = (
    <PlayerCard
      player={player}
      color={color}
      isActive={isActive}
      pieces={pieces}
      position={position}
    />
  );

  return <div className="flex flex-col gap-1">{card}</div>;
}
