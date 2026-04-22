import { GameStatus } from "@/types/chess";

export const getMaterialScore = (pieces: string[] | undefined) => {
  if (!pieces) return 0;
  const values: Record<string, number> = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
    P: 1,
    N: 3,
    B: 3,
    R: 5,
    Q: 9,
  };
  return pieces.reduce((sum, p) => sum + (values[p] || 0), 0);
};

export const getRankTitle = (rating: number) => {
  if (rating >= 2000) return { title: "Master", color: "#f59e0b" };
  if (rating >= 1600) return { title: "Expert", color: "#c084fc" };
  if (rating >= 1300) return { title: "Intermediate", color: "#7dd3fc" };
  return { title: "Beginner", color: "#4ade80" };
};

export const getWinRate = (wins: number, losses: number, draws: number) => {
  const total = wins + losses + draws;
  if (total === 0) return 0;
  return Math.round(((wins + draws * 0.5) / total) * 100);
};

export const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
};
export const PIECE_GLYPHS: Record<string, string> = {
  q: "♕",
  r: "♖",
  b: "♗",
  n: "♘",
  p: "♙",
};
export const START_COUNTS: Record<string, number> = {
  p: 8,
  n: 2,
  b: 2,
  r: 2,
  q: 1,
};

export function parseFenPieces(fen: string) {
  const counts = {
    white: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    black: { p: 0, n: 0, b: 0, r: 0, q: 0 },
  };
  for (const ch of fen.split(" ")[0]) {
    if (!/[pnbrq]/i.test(ch)) continue;
    const lower = ch.toLowerCase() as keyof typeof counts.white;
    if (ch === ch.toUpperCase()) counts.white[lower]++;
    else counts.black[lower]++;
  }
  return counts;
}

export function getMaterialAdvantage(fen: string) {
  const pieces = parseFenPieces(fen);
  const capturedByWhite: Record<string, number> = {};
  const capturedByBlack: Record<string, number> = {};
  let whiteScore = 0,
    blackScore = 0;

  for (const p of ["p", "n", "b", "r", "q"] as const) {
    capturedByWhite[p] = Math.max(0, START_COUNTS[p] - pieces.black[p]);
    capturedByBlack[p] = Math.max(0, START_COUNTS[p] - pieces.white[p]);
    whiteScore += capturedByWhite[p] * PIECE_VALUES[p];
    blackScore += capturedByBlack[p] * PIECE_VALUES[p];
  }

  return {
    capturedByWhite,
    capturedByBlack,
    diff: whiteScore - blackScore,
  };
}

export function countMoves(pgn: string): number {
  if (!pgn) return 0;
  const moveText = pgn.replace(/\[[\s\S]*?\]/g, "").trim();
  return moveText
    .split(/\s+/)
    .filter(
      (t) =>
        t &&
        !/^\d+\./.test(t) &&
        !["*", "1-0", "0-1", "1/2-1/2"].includes(t) &&
        !/^\{/.test(t),
    ).length;
}

export function avgMoveTime(moveTimes: number[]): number | null {
  if (!moveTimes || !moveTimes.length) return null;
  const valid = moveTimes.filter((t) => t < 120_000);
  if (!valid.length) return null;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length / 1000);
}

export function formatStatus(status: GameStatus) {
  switch (status) {
    case GameStatus.RESIGN:
      return "Resign";
    case GameStatus.TIME_OUT:
      return "Timeout";
    case GameStatus.AGREEMENT:
      return "Agreement";
    case GameStatus.CHECKMATE:
      return "Checkmate";
    case GameStatus.ABANDONED:
      return "Abandoned";
    case GameStatus.STALEMATE:
      return "Stalemate";
    default:
      return status.charAt(0) + status.slice(1).toLowerCase();
  }
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
