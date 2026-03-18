"use client";
import { useEffect, useState } from "react";

export function Clock({
  timeMs,
  isRunning,
}: {
  timeMs: number;
  isRunning: boolean;
}) {
  const [displayMs, setDisplayMs] = useState(timeMs);

  useEffect(() => {
    setDisplayMs(timeMs);
  }, [timeMs]);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(
      () => setDisplayMs((p) => Math.max(0, p - 100)),
      100,
    );
    return () => clearInterval(id);
  }, [isRunning]);

  const totalSec = Math.ceil(displayMs / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const isCritical = totalSec <= 10;
  const isLow = totalSec <= 30;

  return (
    <div
      className={`font-mono text-base font-bold tabular-nums px-2.5 py-1 rounded-md transition-colors ${
        isCritical
          ? "bg-red-900/50 text-red-300 animate-pulse"
          : isLow
            ? "bg-orange-900/30 text-orange-300"
            : "bg-zinc-800 text-zinc-100"
      }`}
    >
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </div>
  );
}
