"use client";

import { Clock } from "./clock";


interface PlayerCardProps {
  userId: string;
  color: "w" | "b";
  timeMs: number;
  isActive: boolean;
}

export function PlayerCard({ userId, color, timeMs, isActive }: PlayerCardProps) {
  return (
    <div
      className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-colors duration-200 ${isActive
        ? "bg-zinc-800 border-zinc-600"
        : "bg-zinc-900/60 border-zinc-800"
        }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div
          className={`w-6 h-6 rounded-full border flex-shrink-0 ${color === "w"
            ? "bg-zinc-100 border-zinc-300"
            : "bg-zinc-800 border-zinc-600"
            }`}
        />
        <span className="text-sm font-medium text-zinc-200 truncate">{userId}</span>
        {isActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
        )}
      </div>
      <Clock timeMs={timeMs} isRunning={isActive} />
    </div>
  );
}