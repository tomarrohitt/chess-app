import { PlayerColor } from "@/types/chess";
import { Clock } from "./clock";
import { PlayerCard } from "./player-card";
import { memo } from "react";
import { GameStateUser } from "@/types/player";

interface PlayerAreaProps {
  player: GameStateUser;
  color: PlayerColor;
  isActive: boolean;
  materialAdvantage: number;
  position: "top" | "bottom";
  timeMs: number;
  pieces: React.ReactNode;
  clockRunning: boolean;
}

export const PlayerArea = memo(function PlayerArea({
  timeMs,
  clockRunning,
  pieces,
  color,
  ...rest
}: PlayerAreaProps) {
  return (
    <div className="flex flex-col gap-1">
      <PlayerCard
        {...rest}
        pieces={pieces}
        clock={
          <Clock
            timeMs={timeMs}
            isRunning={clockRunning}
            isWhite={color === PlayerColor.WHITE}
          />
        }
        color={color}
      />
    </div>
  );
});
