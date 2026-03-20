"use client";

import { useGameStore } from "@/store/use-game-store";
import { usePathname, useRouter } from "next/navigation";
import { Play } from "lucide-react";

export function ActiveGameBanner() {
  const { activeGame } = useGameStore((s) => s);
  const pathname = usePathname();
  const router = useRouter();

  if (!activeGame?.gameId) return null;
  if (pathname === `/game/${activeGame?.gameId}`) return null;

  return (
    <div className="bg-amber-500 text-zinc-900 px-4 py-2.5 flex items-center justify-center gap-4 shadow-md sticky top-0 z-50">
      <span className="text-sm font-bold flex items-center gap-2">
        <Play className="w-4 h-4 fill-zinc-900" /> You have an active game in
        progress
      </span>
      <button
        onClick={() => router.push(`/game/${activeGame?.gameId}`)}
        className="text-xs bg-zinc-900 text-white px-3 py-1.5 rounded-md hover:bg-zinc-800 transition-colors font-semibold shadow-sm"
      >
        Return to Game
      </button>
    </div>
  );
}
