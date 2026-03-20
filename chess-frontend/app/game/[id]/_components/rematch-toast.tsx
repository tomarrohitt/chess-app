"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useSocket } from "@/store/socket-provider";
import { useGameStore } from "@/store/use-game-store";
import { PlayerInfo } from "@/types/chess";

interface RematchToastProps {
  rematchOffer: {
    offeredBy: PlayerInfo;
    timeControl: string;
    gameId: string;
  };
}

export function RematchToast({ rematchOffer }: RematchToastProps) {
  const { acceptRematch, declineRematch } = useSocket();
  const { offeredBy, timeControl, gameId } = rematchOffer;

  useEffect(() => {
    console.log({ rematchOffer });
    if (rematchOffer && gameId && timeControl) {
      toast(
        `${rematchOffer.offeredBy.username} wants a rematch!
        ${rematchOffer.timeControl}`,
        {
          id: `rematch-offer-${gameId}`,
          duration: 15000,
          onAutoClose: () => {
            useGameStore.setState({ rematchOffer: null });
          },
          onDismiss: () => {
            useGameStore.setState({ rematchOffer: null });
          },
          action: {
            label: "Accept",
            onClick: () => {
              acceptRematch(gameId, timeControl);
              useGameStore.setState({ rematchOffer: null });
            },
          },
          cancel: {
            label: "Decline",
            onClick: () => {
              declineRematch(gameId, timeControl);
              useGameStore.setState({ rematchOffer: null });
            },
          },
        },
      );
    } else {
      toast.dismiss(`rematch-offer-${gameId}`);
    }
  }, [
    rematchOffer,
    gameId,
    offeredBy,
    timeControl,
    acceptRematch,
    declineRematch,
  ]);

  return null;
}
