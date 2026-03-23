"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function Clock({
  timeMs,
  isRunning,
  isWhite,
}: {
  timeMs: number;
  isRunning: boolean;
  isWhite: boolean;
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
      className={cn(
        "font-mono text-base font-semibold tabular-nums px-3 py-1.5 rounded-md transition-colors duration-300 shrink-0 tracking-wide",
        isRunning && !isCritical && !isLow && "bg-zinc-800/80 text-amber-200",
        isRunning && isLow && !isCritical && "bg-amber-950/60 text-amber-400",
        isRunning && isCritical && "bg-red-950/70 text-red-400 animate-pulse",
        !isRunning && "bg-zinc-900/60 text-zinc-500",
        !isRunning && !isWhite && "bg-zinc-700/60 text-zinc-500",
      )}
    >
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </div>
  );
}
