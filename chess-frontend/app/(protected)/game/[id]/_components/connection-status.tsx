"use client";
import { useGameStore } from "@/store/use-game-store";

export function ConnectionStatus() {
  const status = useGameStore((s) => s.connectionStatus);

  const statusColors = {
    idle: "bg-zinc-500",
    connecting: "bg-yellow-500 animate-pulse",
    connected: "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]",
    disconnected: "bg-red-500",
    error: "bg-red-600",
  };

  return (
    <div className="absolute top-20 right-4 flex items-center gap-2 bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-800 backdrop-blur-sm z-50">
      <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
      <span className="text-xs font-mono text-zinc-300 uppercase tracking-wider">
        {status}
      </span>
    </div>
  );
}
