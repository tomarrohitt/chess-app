"use client";

import { wrap, type Remote } from "comlink";
import type { IChessWorker } from "./chess-worker";

let chessWorkerProxy: Remote<IChessWorker> | null = null;

export function useChessWorker() {
  if (typeof window !== "undefined" && !chessWorkerProxy) {
    const worker = new Worker(new URL("./chess-worker.ts", import.meta.url), {
      type: "module",
    });
    chessWorkerProxy = wrap<IChessWorker>(worker);
  }
  return chessWorkerProxy;
}
