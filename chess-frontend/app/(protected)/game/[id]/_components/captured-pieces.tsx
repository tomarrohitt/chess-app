"use client";
import { cn } from "@/lib/utils";
import { PLAYER_COLOR } from "@/types/chess";
import { defaultPieces } from "react-chessboard";

interface CapturedPiecesProps {
  capturedPieces: string[] | undefined;
  color: PLAYER_COLOR;
  materialAdvantage?: number;
  position: "top" | "bottom";
}

export function CapturedPieces({
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
          const key = (
            color === PLAYER_COLOR.WHITE
              ? `b${piece.toUpperCase()}`
              : `w${piece.toUpperCase()}`
          ) as keyof typeof defaultPieces;
          const PieceSvg = defaultPieces[key];
          const isDiff =
            i > 0 && sorted[i - 1].toLowerCase() !== piece.toLowerCase();
          return (
            <div
              key={i}
              className={`w-5 h-5 ${i === 0 ? "" : isDiff ? "ml-0.5" : "-ml-1.5"}`}
            >
              {PieceSvg && <PieceSvg />}
            </div>
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
