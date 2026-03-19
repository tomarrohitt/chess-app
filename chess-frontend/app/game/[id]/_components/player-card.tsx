"use client";

import { PLAYER_COLOR } from "@/types/chess";
import { Clock } from "./clock";
import { cn } from "@/lib/utils";

interface PlayerCardProps {
  username: string;
  rating?: number;
  image?: string | null;
  color: PLAYER_COLOR.WHITE | PLAYER_COLOR.BLACK;
  timeMs: number;
  isActive: boolean;
  pieces: React.ReactNode;
}

export function PlayerCard({
  username,
  rating,
  image,
  color,
  timeMs,
  isActive,
  pieces,
}: PlayerCardProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-2 rounded-lg border transition-colors duration-200 shadow-sm",
        color === PLAYER_COLOR.WHITE ? "bg-zinc-300" : "bg-zinc-800",
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {image ? (
          <img
            src={image}
            alt={username}
            className="w-11 h-11 rounded-md object-cover shrink-0 border border-zinc-700 bg-zinc-800"
          />
        ) : (
          <div
            className={cn(
              "w-11 h-11 rounded-md border shrink-0 flex items-center justify-center font-bold text-sm",
              color === PLAYER_COLOR.WHITE
                ? "bg-white border-zinc-300 text-zinc-800"
                : "bg-zinc-900 border-zinc-600 text-zinc-200",
            )}
          >
            {username.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex flex-col min-w-0 leading-tight mt-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-sm font-bold truncate",
                color === PLAYER_COLOR.WHITE
                  ? "text-zinc-900"
                  : "text-zinc-100",
              )}
            >
              {username}
            </span>
            {rating !== undefined && (
              <span
                className={cn(
                  "text-xs font-medium",
                  color === PLAYER_COLOR.WHITE
                    ? "text-zinc-500"
                    : "text-zinc-400",
                )}
              >
                ({rating})
              </span>
            )}
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
            )}
          </div>
          {pieces}
        </div>
      </div>
      <Clock timeMs={timeMs} isRunning={isActive} />
    </div>
  );
}
