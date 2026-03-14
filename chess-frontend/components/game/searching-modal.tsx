"use client";
import { useGameStore } from "@/store/use-game-store";
import { useSocket } from "@/store/socket-provider";
import { Loader2 } from "lucide-react";

export function SearchingModal() {
  const { queueStatus, queueTimeControl } = useGameStore((s) => s);
  const { leaveQueue } = useSocket();

  if (queueStatus !== "waiting") return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 flex flex-col items-center gap-5 shadow-2xl w-72">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-4xl select-none">
            ♟
          </div>
          <span className="absolute inset-0 rounded-full border-2 border-green-500/40 animate-ping" />
        </div>

        <div className="text-center">
          <h2 className="text-lg font-bold mb-1">Finding Opponent</h2>
          <p className="text-zinc-400 text-sm">
            Searching for a {queueTimeControl ? `${queueTimeControl} ` : ""}match...
          </p>
        </div>

        <div className="flex items-center gap-2 text-zinc-500 text-xs">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>In queue</span>
        </div>

        <button
          onClick={() => leaveQueue()}
          className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}