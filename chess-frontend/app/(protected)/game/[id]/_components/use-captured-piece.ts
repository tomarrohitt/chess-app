import { useState, useEffect } from "react";
import { useChessWorker } from "@/worker/use-chess-worker";
import { CapturedPieces } from "@/worker/chess-worker";

const EMPTY: CapturedPieces = { capturedByWhite: [], capturedByBlack: [] };

export function useCapturedPieces(fen: string) {
  const worker = useChessWorker();
  const [captured, setCaptured] = useState<CapturedPieces>(EMPTY);

  useEffect(() => {
    if (!worker || !fen) return;
    let cancelled = false;
    worker.getCapturedPieces(fen).then((result) => {
      if (cancelled) return;
      setCaptured((prev) =>
        prev.capturedByWhite.join() === result.capturedByWhite.join() &&
        prev.capturedByBlack.join() === result.capturedByBlack.join()
          ? prev
          : result,
      );
    });
    return () => {
      cancelled = true;
    };
  }, [worker, fen]);

  return captured;
}
