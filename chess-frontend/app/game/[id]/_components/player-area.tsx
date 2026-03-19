"use client";

import { PlayerCard } from "./player-card";
import { CapturedPieces } from "./captured-pieces";
import { GameStateUser, PLAYER_COLOR } from "@/types/chess";

interface PlayerAreaProps {
  player: GameStateUser;
  color: PLAYER_COLOR;
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
    />
  );
  const card = (
    <PlayerCard
      username={player.username ?? "Opponent"}
      rating={player.rating}
      image={player.image}
      color={color}
      timeMs={player.timeLeftMs}
      isActive={isActive}
      pieces={pieces}
    />
  );

  return (
    <div className="flex flex-col gap-1">
      {position === "top" ? <>{card}</> : <>{card}</>}
    </div>
  );
}
