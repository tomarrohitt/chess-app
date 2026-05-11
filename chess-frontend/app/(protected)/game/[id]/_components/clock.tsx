import { memo, useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

export const Clock = memo(function Clock({
  timeMs,
  isRunning,
  isWhite,
}: {
  timeMs: number;
  isRunning: boolean;
  isWhite: boolean;
}) {
  const [displayTime, setDisplayTime] = useState(timeMs);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      const startTime = Date.now();
      const initialTime = timeMs;

      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setDisplayTime(Math.max(0, initialTime - elapsed));
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setDisplayTime(timeMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, timeMs]);

  const totalSec = Math.ceil(displayTime / 1000);
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
