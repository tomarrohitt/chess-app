"use client";

import { GameStateUser, PLAYER_COLOR } from "@/types/chess";
import { Clock } from "./clock";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getInitials } from "@/lib/constants/get-initials";

interface PlayerCardProps {
  player: GameStateUser;
  color: PLAYER_COLOR.WHITE | PLAYER_COLOR.BLACK;
  isActive: boolean;
  pieces: React.ReactNode;
  position?: "top" | "bottom";
}

export function PlayerCard({
  player,
  color,
  isActive,
  pieces,
  position = "top",
}: PlayerCardProps) {
  const isWhite = color === PLAYER_COLOR.WHITE;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg border transition-all duration-200 w-125",
        isWhite
          ? "bg-zinc-600/80 border-zinc-800/60"
          : "bg-zinc-800/60 border-zinc-800/40",
      )}
    >
      {player.image ? (
        <img
          src={player.image}
          alt={player.username}
          className="w-10 h-10 rounded-full object-cover shrink-0"
        />
      ) : (
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 font-mono",
            isWhite ? "bg-zinc-800 text-zinc-400" : "bg-zinc-800 text-zinc-400",
          )}
        >
          {getInitials(player.username)}
        </div>
      )}

      <div className="flex flex-col min-w-0 flex-1 gap-0.5 relative">
        {position === "bottom" && pieces}
        <Link href={`/player/${player.id}`} className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium text-zinc-300 truncate">
            {player.username}
          </span>
          {player.rating !== undefined && (
            <span className="font-mono text-xs text-zinc-300 shrink-0">
              {player.rating}
            </span>
          )}
          {isActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80 animate-pulse shrink-0" />
          )}
        </Link>
        {position === "top" && pieces}
      </div>

      <Clock
        timeMs={player.timeLeftMs}
        isRunning={isActive}
        isWhite={isWhite}
      />
    </div>
  );
}
