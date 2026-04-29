"use client";

import {
  createContext,
  memo,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

interface ClockContextValue {
  tick: number;
}

const ClockContext = createContext<ClockContextValue>({ tick: 0 });

export function ClockProvider({
  isRunning,
  children,
}: {
  isRunning: boolean;
  children: React.ReactNode;
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  return (
    <ClockContext.Provider value={{ tick }}>{children}</ClockContext.Provider>
  );
}

export const Clock = memo(function Clock({
  timeMs,
  isRunning,
  isWhite,
}: {
  timeMs: number;
  isRunning: boolean;
  isWhite: boolean;
}) {
  const { tick } = useContext(ClockContext);

  const startTickRef = useRef<number>(tick);
  const startMsRef = useRef<number>(timeMs);

  useEffect(() => {
    startTickRef.current = tick;
    startMsRef.current = timeMs;
  }, [timeMs, isRunning, tick]);

  const elapsed = isRunning ? (tick - startTickRef.current) * 100 : 0;
  const displayMs = Math.max(0, startMsRef.current - elapsed);

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
});
