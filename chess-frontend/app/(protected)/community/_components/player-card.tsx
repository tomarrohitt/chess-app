"use client";

import { SearchFriend } from "@/types/friends";
import { Trophy } from "lucide-react";
import { Avatar } from "./community-shared";

export function PlayerCard({
  player,
  actions,
}: {
  player: SearchFriend;
  actions: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl group transition-all duration-150"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <Avatar
        player={{
          name: player.name,
          image: player.image,
        }}
        size={44}
      />

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <span
            className="text-sm font-semibold text-white truncate"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {player.name}
          </span>
          <span
            className="text-[11px] text-zinc-500 truncate"
            style={{ fontFamily: "'Fira Code', monospace" }}
          >
            @{player.username}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Trophy size={10} className="text-amber-400" />
            <span
              className="text-xs font-bold text-amber-400"
              style={{ fontFamily: "'Fira Code', monospace" }}
            >
              {player.rating}
            </span>
          </div>
          <span className="text-zinc-700 text-xs">·</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">{actions}</div>
    </div>
  );
}
