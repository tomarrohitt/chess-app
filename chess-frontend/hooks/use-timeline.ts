import { useState, useEffect, useRef } from "react";
import { useChessWorker } from "../worker/use-chess-worker";
import { CapturedPieces, TimesResult } from "../worker/chess-worker";

interface TimelineCache {
  pgn: string;
  history: string[];
  fens: string[];
  times: TimesResult[];
  captured: CapturedPieces[];
}

const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export function useTimeline(pgn?: string | null, timeControl?: string) {
  const normalizedPgn = pgn ?? "";

  const [cache, setCache] = useState<TimelineCache>({
    pgn: "",
    history: [],
    fens: [initialFen],
    times: [{ whiteTimeLeftMs: 300000, blackTimeLeftMs: 300000 }],
    captured: [{ capturedByWhite: [], capturedByBlack: [] }],
  });

  const fetchedPgnRef = useRef<string | null>(null);
  const chessWorker = useChessWorker();

  useEffect(() => {
    if (!chessWorker || normalizedPgn === fetchedPgnRef.current) return;

    fetchedPgnRef.current = normalizedPgn;
    let isMounted = true;

    chessWorker.getTimelineCache(normalizedPgn, timeControl).then((result) => {
      if (isMounted) setCache(result as TimelineCache);
    });

    return () => {
      isMounted = false;
    };
  }, [normalizedPgn, chessWorker, timeControl]);

  return cache;
}
