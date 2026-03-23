"use client";

import { Chessboard } from "react-chessboard";
import { GameRecord } from "./game-history-with-board";

interface GameboardSnapshotProps {
  game: GameRecord;
  isWhite: boolean;
}

export const GameboardSnapshot = ({
  game,
  isWhite,
}: GameboardSnapshotProps) => {
  return (
    <div style={{ width: 164, height: 164, overflow: "hidden" }}>
      <Chessboard
        options={{
          id: `history-${game.id}`,
          showNotation: false,
          position: game.finalFen || "start",
          boardOrientation: isWhite ? "white" : "black",
          allowDragging: false,
          animationDurationInMs: 0,
        }}
      />
    </div>
  );
};
