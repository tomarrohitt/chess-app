"use client";

import { PLAYER_COLOR } from "@/types/chess";
import { Clock } from "./clock";

interface PlayerCardProps {
  username: string;
  rating?: number;
  image?: string | null;
  color: PLAYER_COLOR.WHITE | PLAYER_COLOR.BLACK;
  timeMs: number;
  isActive: boolean;
}

export function PlayerCard({
  username,
  rating,
  image,
  color,
  timeMs,
  isActive,
}: PlayerCardProps) {
  return (
    <div
      className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-colors duration-200 ${
        isActive
          ? "bg-zinc-800 border-zinc-600"
          : "bg-zinc-900/60 border-zinc-800"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {image ? (
          <img
            src={image}
            alt={username}
            className="w-9 h-9 rounded-md object-cover shrink-0 border border-zinc-700 bg-zinc-800"
          />
        ) : (
          <div
            className={`w-9 h-9 rounded-md border shrink-0 flex items-center justify-center font-bold text-sm ${
              color === PLAYER_COLOR.WHITE
                ? "bg-zinc-200 border-zinc-300 text-zinc-800"
                : "bg-zinc-800 border-zinc-600 text-zinc-200"
            }`}
          >
            {username.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex flex-col min-w-0 leading-tight">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-zinc-200 truncate">
              {username}
            </span>
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
            )}
          </div>
          {rating !== undefined && (
            <span className="text-xs font-medium text-zinc-400">
              ({rating})
            </span>
          )}
        </div>
      </div>
      <Clock timeMs={timeMs} isRunning={isActive} />
    </div>
  );
}
