"use client";

import { PLAYER_COLOR } from "@/types/chess";
import { defaultPieces } from "react-chessboard";

interface CapturedPiecesProps {
  capturedPieces: string[] | undefined;
  color: PLAYER_COLOR;
  materialAdvantage?: number;
}

export function CapturedPieces({
  capturedPieces,
  color,
  materialAdvantage = 0,
}: CapturedPiecesProps) {
  if (
    (!capturedPieces || capturedPieces.length === 0) &&
    materialAdvantage <= 0
  ) {
    return <div className="min-h-8" />;
  }

  // Define piece values for sorting visually
  const pieceValues: Record<string, number> = {
    p: 1,
    P: 1,
    n: 3,
    N: 3,
    b: 3,
    B: 3,
    r: 5,
    R: 5,
    q: 9,
    Q: 9,
  };

  const sortedPieces = [...(capturedPieces || [])].sort(
    (a, b) => (pieceValues[a] || 0) - (pieceValues[b] || 0),
  );

  return (
    <div className="flex flex-wrap items-center min-h-8 px-1">
      {sortedPieces.map((piece, i) => {
        const pieceKey =
          color === PLAYER_COLOR.WHITE
            ? (`b${piece.toUpperCase()}` as keyof typeof defaultPieces)
            : (`w${piece.toUpperCase()}` as keyof typeof defaultPieces);

        const PieceSvg = defaultPieces[pieceKey];

        const isDifferentFromPrev =
          i > 0 && sortedPieces[i - 1].toLowerCase() !== piece.toLowerCase();

        let marginClass = "-ml-2 sm:-ml-2.5";
        if (i === 0) marginClass = "ml-0";
        else if (isDifferentFromPrev) marginClass = "ml-0.5 sm:ml-1";

        return (
          <div
            key={i}
            className={`w-4 h-4 sm:w-5 sm:h-5 drop-shadow-md ${marginClass}`}
          >
            {PieceSvg && <PieceSvg />}
          </div>
        );
      })}
      {materialAdvantage > 0 && (
        <span className="text-[11px] sm:text-xs font-bold text-zinc-300 bg-zinc-800/80 border border-zinc-700/50 px-1.5 py-0.75 rounded-full ml-2 sm:ml-3 shadow-sm flex items-center justify-center">
          +{materialAdvantage}{" "}
        </span>
      )}
    </div>
  );
}
