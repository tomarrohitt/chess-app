"use client";

import { useGameStore } from "@/store/use-game-store";
import { useSocket } from "@/store/socket-provider";
import { OfferToast } from "@/components/offer-toast";

export function GlobalRematchToast() {
  const rematchOffer = useGameStore((state) => state.rematchOffer);
  const { acceptRematch, declineRematch } = useSocket();

  return (
    <OfferToast
      id={rematchOffer ? `rematch-offer-${rematchOffer.gameId}` : null}
      title={
        rematchOffer
          ? `${rematchOffer.offeredBy.username} wants a rematch!`
          : ""
      }
      timeControl={rematchOffer ? rematchOffer.timeControl : ""}
      onAccept={() => {
        if (rematchOffer) {
          acceptRematch(rematchOffer.gameId, rematchOffer.timeControl);
          useGameStore.setState({ rematchOffer: null });
        }
      }}
      onDecline={() => {
        if (rematchOffer) {
          declineRematch(rematchOffer.gameId, rematchOffer.timeControl);
          useGameStore.setState({ rematchOffer: null });
        }
      }}
      onDismiss={() => {
        useGameStore.setState({ rematchOffer: null });
      }}
    />
  );
}
