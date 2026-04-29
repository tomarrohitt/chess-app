"use client";

import { useGameStore } from "@/store/use-game-store";
import { useSocket } from "@/store/socket-provider";
import { DrawOffer } from "@/types/chess";

interface ActiveGameControlsProps {
  gameId: string;
  isPlayer: boolean;
}

export function ActiveGameControls({
  gameId,
  isPlayer,
}: ActiveGameControlsProps) {
  const drawOfferSent = useGameStore((s) => s.drawOfferSent);
  const { offerDraw, resign } = useSocket();

  if (!isPlayer) return null;

  return (
    <div className="flex gap-4 mt-4">
      {!drawOfferSent && (
        <button
          onClick={() => offerDraw(gameId)}
          className="cursor-pointer flex-1 py-2 font-mono text-[11px] text-zinc-300 bg-zinc-700/40 border border-zinc-800/30 rounded-lg hover:bg-zinc-500/40   hover:text-zinc-200 transition-all font-semibold"
        >
          ½ Offer draw
        </button>
      )}
      {drawOfferSent === DrawOffer.SENT && (
        <div className="flex-1 py-2 font-mono text-[11px] text-zinc-600 bg-zinc-900/40 border border-zinc-800/30 rounded-lg text-center">
          Draw offered...
        </div>
      )}
      {drawOfferSent === DrawOffer.DECLINE && (
        <div className="flex-1 py-2 font-mono text-[11px] text-rose-500/70 bg-rose-950/20 border border-rose-900/30 rounded-lg text-center">
          Draw declined
        </div>
      )}

      <button
        onClick={() => resign(gameId)}
        className="cursor-pointer flex-1 py-2 font-mono text-[11px] text-rose-400/80 bg-rose-950/20 border border-rose-900/30 rounded-lg hover:bg-rose-950/40 hover:text-rose-300 transition-all"
      >
        Resign
      </button>
    </div>
  );
}
