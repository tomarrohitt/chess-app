"use client";

import { useGameStore } from "@/store/use-game-store";
import { useSocket } from "@/store/socket-provider";
import { OfferToast } from "@/components/offer-toast";

export function GlobalChallengeToast() {
  const incomingChallenge = useGameStore((state) => state.incomingChallenge);
  const { acceptChallenge, declineChallenge } = useSocket();

  return (
    <OfferToast
      id={
        incomingChallenge
          ? `challenge-offer-${incomingChallenge.offeredBy.id}`
          : null
      }
      title={
        incomingChallenge
          ? `${incomingChallenge.offeredBy.username} challenged you!`
          : ""
      }
      timeControl={incomingChallenge ? incomingChallenge.timeControl : ""}
      onAccept={() => {
        if (incomingChallenge) {
          acceptChallenge(
            incomingChallenge.offeredBy.id,
            incomingChallenge.timeControl,
          );
          useGameStore.setState({ incomingChallenge: null });
        }
      }}
      onDecline={() => {
        if (incomingChallenge) {
          declineChallenge(incomingChallenge.offeredBy.id);
          useGameStore.setState({ incomingChallenge: null });
        }
      }}
      onDismiss={() => {
        useGameStore.setState({ incomingChallenge: null });
      }}
    />
  );
}
