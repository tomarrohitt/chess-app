"use client";

import { useGameStore } from "@/store/use-game-store";
import { useSocket } from "@/store/socket-provider";

interface IncomingDrawOfferProps {
  gameId: string;
  isPlayer: boolean;
}

export function IncomingDrawOffer({
  gameId,
  isPlayer,
}: IncomingDrawOfferProps) {
  const { drawOffer } = useGameStore();
  const { acceptDraw, declineDraw } = useSocket();

  if (!isPlayer || !drawOffer) return null;

  return (
    <div className="mx-3 mb-2 p-3 bg-zinc-900/80 border border-zinc-700/60 rounded-lg mt-6">
      <p className="font-mono text-xs text-zinc-400 text-center mb-3">
        Opponent offered a draw
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => acceptDraw(gameId)}
          className="flex-1 py-1.5 bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 font-mono text-[11px] font-medium rounded-md hover:bg-emerald-950 transition-colors"
        >
          Accept
        </button>
        <button
          onClick={() => declineDraw(gameId)}
          className="flex-1 py-1.5 bg-zinc-900 border border-zinc-700/40 text-zinc-500 font-mono text-[11px] font-medium rounded-md hover:bg-zinc-800 transition-colors"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
