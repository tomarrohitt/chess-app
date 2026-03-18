import { useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { cn } from "@/lib/utils";

interface MoveListProps {
  pgn: string;
  timeControl: string;
  state: "playing" | "finished";
  currentMoveIndex?: number;
  onMoveClick?: (index: number) => void;
}

interface MoveDetail {
  san: string;
  timeSpent?: string;
  index: number;
}

interface MovePair {
  number: number;
  white: MoveDetail;
  black?: MoveDetail;
}

function clkToSeconds(clk: string): number {
  const match = clk.match(/(\d+):(\d{2}):(\d{2})/);
  if (!match) return 0;
  return (
    parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3])
  );
}

function parsePgnWithTimes(pgn: string, timeControl: string): MovePair[] {
  if (!pgn) return [];
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    const history = chess.history();

    const clkMatches = [...pgn.matchAll(/\[%clk (\d+:\d{2}:\d{2})\]/g)].map(
      (m) => clkToSeconds(m[1]),
    );

    let initialSeconds = 300;
    let increment = 0;
    if (timeControl) {
      const [mins, inc] = timeControl.split("+").map(Number);
      if (!isNaN(mins)) initialSeconds = mins * 60;
      if (!isNaN(inc)) increment = inc;
    }

    const pairs: MovePair[] = [];
    let lastWhiteClk = initialSeconds;
    let lastBlackClk = initialSeconds;

    for (let i = 0; i < history.length; i += 2) {
      const whiteClk = clkMatches[i];
      const blackClk = clkMatches[i + 1];

      const whiteDiff =
        whiteClk !== undefined
          ? lastWhiteClk - whiteClk + increment
          : undefined;
      const blackDiff =
        blackClk !== undefined
          ? lastBlackClk - blackClk + increment
          : undefined;

      pairs.push({
        number: Math.floor(i / 2) + 1,
        white: {
          san: history[i],
          timeSpent:
            whiteDiff !== undefined ? `${Math.max(0, whiteDiff)}s` : undefined,
          index: i,
        },
        black: history[i + 1]
          ? {
              san: history[i + 1],
              timeSpent:
                blackDiff !== undefined
                  ? `${Math.max(0, blackDiff)}s`
                  : undefined,
              index: i + 1,
            }
          : undefined,
      });

      lastWhiteClk = whiteClk !== undefined ? whiteClk : lastWhiteClk;
      lastBlackClk = blackClk !== undefined ? blackClk : lastBlackClk;
    }
    return pairs;
  } catch {
    return [];
  }
}

export function MoveList({
  pgn,
  timeControl,
  state = "playing",
  currentMoveIndex,
  onMoveClick,
}: MoveListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pairs = parsePgnWithTimes(pgn, timeControl);

  useEffect(() => {
    if (state === "playing" && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [pairs.length, state]);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden min-h-0",
        state === "finished" ? "h-80" : "h-140 scroll-smooth",
      )}
    >
      <p className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase px-1 pb-2 shrink-0">
        Move History
      </p>
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-0.5 scrollbar-thin bg-gray-700 rounded-md"
      >
        {pairs.length === 0 ? (
          <p className="text-zinc-200 text-xs italic px-1 py-4 text-center">
            Waiting for first move...
          </p>
        ) : (
          pairs.map((pair) => (
            <div
              key={pair.number}
              className="flex items-center text-sm group py-2"
            >
              <span className="w-8 text-zinc-200 text-[10px] tabular-nums text-right pr-2">
                {pair.number}.
              </span>

              <div
                className={cn(
                  "ml-3 flex justify-between items-center py-1 rounded transition-colors group/m w-20 px-1 font-bold cursor-pointer",
                  currentMoveIndex === pair.white.index
                    ? "bg-amber-500 text-zinc-900"
                    : "bg-gray-400 text-zinc-800 hover:bg-gray-300",
                )}
                onClick={() => onMoveClick?.(pair.white.index)}
              >
                <span className="text-zinc-800">{pair.white.san}</span>
                {pair.white.timeSpent && (
                  <span className="text-[9px] text-zinc-800 font-mono group-hover/m:opacity-100 transition-opacity">
                    {pair.white.timeSpent}
                  </span>
                )}
              </div>

              {pair.black ? (
                <div
                  className={cn(
                    "ml-3 flex justify-between items-center px-2 py-1 rounded transition-colors group/m w-20 font-bold cursor-pointer",
                    currentMoveIndex === pair.black.index
                      ? "bg-amber-500 text-zinc-900"
                      : "bg-gray-800 text-zinc-200 hover:bg-gray-700",
                  )}
                  onClick={() => {
                    if (pair.black) onMoveClick?.(pair.black.index);
                  }}
                >
                  <span className="text-zinc-200">{pair.black.san}</span>
                  {pair.black.timeSpent && (
                    <span className="text-[9px] text-zinc-100 font-mono ">
                      {pair.black.timeSpent}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex-1" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
