"use client";
import { useSocket } from "@/store/socket-provider";

export const NewGame = ({ timeControl }: { timeControl: string }) => {
  const { joinQueue } = useSocket();
  return (
    <button
      onClick={() => timeControl && joinQueue(timeControl)}
      className="flex-1 px-2 py-1.5 font-mono text-xs text-emerald-400/80 bg-emerald-950/20 border border-emerald-900/30 rounded-lg hover:bg-emerald-950/40 hover:text-emerald-300 hover:border-emerald-800/50 transition-all "
    >
      New game
    </button>
  );
};
