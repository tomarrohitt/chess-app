import { useMemo } from "react";
import { Chess } from "chess.js";

export function useTimeline(pgn?: string | null) {
  return useMemo(() => {
    const chess = new Chess();
    if (pgn) {
      chess.loadPgn(pgn);
    }
    const history = chess.history();

    const temp = new Chess();
    const fens = [temp.fen({ forceEnpassantSquare: true })]; // Start position
    for (const move of history) {
      temp.move(move);
      fens.push(temp.fen({ forceEnpassantSquare: true }));
    }
    return { history, fens };
  }, [pgn]);
}
