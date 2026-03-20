import { useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { cn } from "@/lib/utils";

interface MoveListProps {
  pgn: string;
  timeControl: string;
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

interface MoveButtonProps {
  move: MoveDetail;
  isActive: boolean;
  onClick?: (index: number) => void;
}

function MoveButton({ move, isActive, onClick }: MoveButtonProps) {
  return (
    <div
      className={cn(
        "ml-3 flex justify-between items-center px-1.5 py-1 rounded transition-colors group/m w-30 font-bold cursor-pointer text-white",
        isActive && "bg-gray-800",
      )}
      data-active={isActive ? "true" : undefined}
      onClick={() => onClick?.(move.index)}
    >
      <span>{move.san}</span>
      <span className="text-xs font-mono opacity-80 group-hover/m:opacity-100 transition-opacity">
        {move.timeSpent}
      </span>
    </div>
  );
}

function clkToSeconds(clk: string): number {
  const match = clk.match(/(\d+):(\d{2}):(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  return (
    parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseFloat(match[3])
  );
}

function parsePgnWithTimes(pgn: string, timeControl: string): MovePair[] {
  if (!pgn) return [];
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    const history = chess.history();

    const clkMatches = [
      ...pgn.matchAll(/\[%clk (\d+:\d{2}:\d+(?:\.\d+)?)\]/g),
    ].map((m) => clkToSeconds(m[1]));

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
            whiteDiff !== undefined
              ? `${Math.max(0.1, whiteDiff).toFixed(1)}s`
              : undefined,
          index: i,
        },
        black: history[i + 1]
          ? {
              san: history[i + 1],
              timeSpent:
                blackDiff !== undefined
                  ? `${Math.max(0.1, blackDiff).toFixed(1)}s`
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
  currentMoveIndex,
  onMoveClick,
}: MoveListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pairs = parsePgnWithTimes(pgn, timeControl);

  useEffect(() => {
    if (!scrollContainerRef.current) return;

    if (currentMoveIndex === -1) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    const activeMoveElement = scrollContainerRef.current.querySelector(
      '[data-active="true"]',
    );

    if (activeMoveElement) {
      activeMoveElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    } else {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [pairs.length, currentMoveIndex]);

  return (
    <div className="flex flex-col overflow-hidden w-100 h-80 scroll-smooth">
      <p className="text-zinc-800 text-[10px] font-bold tracking-widest uppercase px-1 pb-2 shrink-0">
        Move History
      </p>
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-0.5 bg-gray-700 rounded-md scrollbar-thin [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-500 [&::-webkit-scrollbar-thumb]:rounded-none hover:[&::-webkit-scrollbar-thumb]:bg-gray-400"
      >
        {pairs.length === 0 ? (
          <p className="text-zinc-200 text-xs italic px-1 py-4 text-center">
            Waiting for first move...
          </p>
        ) : (
          pairs.map((pair) => (
            <div
              key={pair.number}
              className="flex items-center cursor-pointer text-sm group py-0.5 gap-x-3"
            >
              <span className="w-8 text-zinc-200 text-[10px] tabular-nums text-right pr-2 cursor-default select-none">
                {pair.number}.
              </span>

              <div className="flex justify-between flex-1">
                <MoveButton
                  move={pair.white}
                  isActive={currentMoveIndex === pair.white.index}
                  onClick={onMoveClick}
                />

                {pair.black ? (
                  <MoveButton
                    move={pair.black}
                    isActive={currentMoveIndex === pair.black.index}
                    onClick={onMoveClick}
                  />
                ) : (
                  <div className="ml-3 px-1.5 py-1 w-30 " />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
