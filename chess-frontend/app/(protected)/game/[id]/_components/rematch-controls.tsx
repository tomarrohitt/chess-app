"use client";

import { useGameStore } from "@/store/use-game-store";
import { useSocket } from "@/store/socket-provider";
import { DRAW_OFFER } from "@/types/chess";

interface RematchControlsProps {
  gameId: string;
  timeControl: string;
  isPlayer: boolean;
}

export function RematchControls({
  gameId,
  timeControl,
  isPlayer,
}: RematchControlsProps) {
  const { rematchOffer, rematchOfferSent } = useGameStore();
  const { offerRematch } = useSocket();

  if (!isPlayer) return null;

  if (rematchOfferSent === DRAW_OFFER.SENT) {
    return (
      <div className="flex-1 py-2 font-mono text-[11px] text-zinc-600 bg-zinc-900/40 border border-zinc-800/30 rounded-lg text-center">
        Rematch sent...
      </div>
    );
  }

  if (rematchOfferSent === DRAW_OFFER.DECLINE) {
    return (
      <div className="flex-1 py-2 font-mono text-[11px] text-rose-500/70 bg-rose-950/20 border border-rose-900/30 rounded-lg text-center">
        Rematch declined
      </div>
    );
  }

  if (!rematchOffer) {
    return (
      <button
        onClick={() => offerRematch(gameId, timeControl)}
        className="flex-1 py-2 font-mono text-[11px] text-sky-400/80 bg-sky-950/20 border border-sky-900/30 rounded-lg hover:bg-sky-950/40 hover:text-sky-300 transition-all"
      >
        Rematch
      </button>
    );
  }

  return null;
}
