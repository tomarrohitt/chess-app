import { PlayerColor } from "@/types/chess";
import { getMaterialScore } from "@/lib/chess-utils";

export function getCapturedPieces(fen: string) {
  const counts: Record<string, number> = {
    p: 0,
    n: 0,
    b: 0,
    r: 0,
    q: 0,
    P: 0,
    N: 0,
    B: 0,
    R: 0,
    Q: 0,
  };

  const initialCounts: Record<string, number> = {
    p: 8,
    n: 2,
    b: 2,
    r: 2,
    q: 1,
    P: 8,
    N: 2,
    B: 2,
    R: 2,
    Q: 1,
  };

  const position = fen.split(" ")[0];
  for (const char of position) {
    if (counts[char] !== undefined) {
      counts[char]++;
    }
  }

  const capturedByWhite: string[] = [];
  const capturedByBlack: string[] = [];

  // White captures black pieces (lowercase)
  ["p", "n", "b", "r", "q"].forEach((piece) => {
    const diff = initialCounts[piece] - counts[piece];
    for (let i = 0; i < diff; i++) {
      capturedByWhite.push(piece);
    }
  });

  // Black captures white pieces (uppercase)
  ["P", "N", "B", "R", "Q"].forEach((piece) => {
    const diff = initialCounts[piece] - counts[piece];
    for (let i = 0; i < diff; i++) {
      capturedByBlack.push(piece);
    }
  });

  return {
    capturedByWhite,
    capturedByBlack,
  };
}

export function getPlayerAdvantages(
  whiteCaptured: string[] | undefined,
  blackCaptured: string[] | undefined,
  topColor: PlayerColor,
) {
  const whiteMaterialScore = getMaterialScore(whiteCaptured || []);
  const blackMaterialScore = getMaterialScore(blackCaptured || []);

  const topAdvantage =
    topColor === PlayerColor.WHITE
      ? whiteMaterialScore - blackMaterialScore
      : blackMaterialScore - whiteMaterialScore;

  return {
    topAdvantage,
    bottomAdvantage: -topAdvantage,
  };
}
