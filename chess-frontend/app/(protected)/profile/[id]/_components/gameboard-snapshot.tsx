"use client";

import { useMemo } from "react";
import Chessground from "@bezalel6/react-chessground";
import { GameRecord } from "@/types/history";
import type { Config } from "chessground/config";

interface GameboardSnapshotProps {
  game: GameRecord;
  isWhite: boolean;
}

export const GameboardSnapshot = ({
  game,
  isWhite,
}: GameboardSnapshotProps) => {
  const config = useMemo(
    (): Partial<Config> => ({
      fen: game.finalFen || "start",
      orientation: isWhite ? "white" : "black",
      viewOnly: true,
      animation: { enabled: false },
      movable: { free: false, color: undefined },
      draggable: { enabled: false },
      selectable: { enabled: false },
      coordinates: false,
    }),
    [game.finalFen, isWhite],
  );

  return (
    <div style={{ width: 164, height: 164, overflow: "hidden" }}>
      <Chessground contained config={config} />
    </div>
  );
};
