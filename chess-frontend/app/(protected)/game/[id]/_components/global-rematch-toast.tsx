"use client";

import { useGameStore } from "@/store/use-game-store";
import { RematchToast } from "./rematch-toast";

export function GlobalRematchToast() {
  const rematchOffer = useGameStore((state) => state.rematchOffer);

  if (!rematchOffer) return null;

  return <RematchToast rematchOffer={rematchOffer} />;
}
