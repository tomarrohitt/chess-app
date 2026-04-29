"use client";
import { cn } from "@/lib/utils";
import { PlayerColor } from "@/types/chess";
import { memo } from "react";

const PIECE_UNICODE: Record<string, string> = {
  p: "♙",
  n: "♞",
  b: "♝",
  r: "♜",
  q: "♛",
  P: "♙",
  N: "♘",
  B: "♗",
  R: "♖",
  Q: "♕",
};

interface CapturedPiecesProps {
  capturedPieces: string[] | undefined;
  color: PlayerColor;
  materialAdvantage?: number;
  position: "top" | "bottom";
}

function CapturedPiecesComponent({
  capturedPieces,
  color,
  materialAdvantage = 0,
  position,
}: CapturedPiecesProps) {
  if (
    (!capturedPieces || capturedPieces.length === 0) &&
    materialAdvantage <= 0
  ) {
    return <div className="h-4" />;
  }

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

  const sorted = [...(capturedPieces || [])].sort(
    (a, b) => (pieceValues[a] || 0) - (pieceValues[b] || 0),
  );

  return (
    <div className="flex flex-wrap items-center gap-px h-4 relative">
      <div
        className={cn(
          "flex justify-center items-center",
          position === "bottom" && "absolute",
        )}
      >
        {sorted.map((piece, i) => {
          const unicodeKey =
            color === PlayerColor.WHITE
              ? piece.toLowerCase()
              : piece.toUpperCase();
          const isDiff =
            i > 0 && sorted[i - 1].toLowerCase() !== piece.toLowerCase();
          return (
            <span
              key={i}
              className={`text-base leading-none select-none ${i === 0 ? "" : isDiff ? "ml-0.5" : "-ml-1.5"}`}
            >
              {PIECE_UNICODE[unicodeKey]}
            </span>
          );
        })}
        {materialAdvantage > 0 && (
          <span className="font-mono text-[14px] font-semibold text-white ml-1.5">
            +{materialAdvantage}
          </span>
        )}
      </div>
    </div>
  );
}

export const CapturedPieces = memo(CapturedPiecesComponent);
