import { memo, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { MovePair } from "@/worker/chess-worker";
import { useChessWorker } from "@/worker/use-chess-worker";

interface MoveListProps {
  pgn: string;
  timeControl: string;
  currentMoveIndex?: number;
  onMoveClick?: (index: number) => void;
  live?: boolean;
}

interface MoveButtonProps {
  move: MovePair["white"];
  isActive: boolean;
  color: "w" | "b";
  onClick?: (index: number) => void;
}

function SanText({ san, color }: { san: string; color: "w" | "b" }) {
  const pieceIcons = {
    w: { K: "♚", Q: "♛", R: "♜", B: "♝", N: "♞" },
    b: { K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘" },
  };

  const pieceMatch = san.match(/^([KQRBN])(.*)$/);
  const promotionMatch = san.match(/^(.*?)=([QRBN])(.*)$/);

  if (pieceMatch) {
    const [, piece, rest] = pieceMatch;
    return (
      <span className="flex items-center">
        <span className="text-xl leading-none w-4 inline-flex justify-center mr-0.5">
          {pieceIcons[color][piece as keyof (typeof pieceIcons)["w"]]}
        </span>
        <span>{rest}</span>
      </span>
    );
  }

  if (promotionMatch) {
    const [, start, piece, end] = promotionMatch;
    return (
      <span className="flex items-center">
        <span>{start}=</span>
        <span className="text-lg leading-none w-4 inline-flex justify-center mx-0.5">
          {pieceIcons[color][piece as keyof (typeof pieceIcons)["w"]]}
        </span>
        <span>{end}</span>
      </span>
    );
  }

  return <span>{san}</span>;
}

const MoveButton = memo(function MoveButton({
  move,
  isActive,
  color,
  onClick,
}: MoveButtonProps) {
  return (
    <div
      className={cn(
        "ml-3 flex justify-between items-center px-1.5 py-1 rounded transition-colors group/m w-30 font-bold cursor-pointer text-white",
        isActive && "bg-gray-800",
      )}
      data-active={isActive ? "true" : undefined}
      onClick={() => onClick?.(move.index)}
    >
      <SanText san={move.san} color={color} />
      <span className="text-xs font-mono opacity-80 group-hover/m:opacity-100 transition-opacity">
        {move.timeSpent}
      </span>
    </div>
  );
});

export const MoveList = memo(function MoveList({
  pgn,
  timeControl,
  currentMoveIndex,
  onMoveClick,
  live = false,
}: MoveListProps) {
  const worker = useChessWorker();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [pairs, setPairs] = useState<MovePair[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!worker) return;
    worker.parsePgnWithTimes(pgn, timeControl).then((result) => {
      if (!cancelled) setPairs(result);
    });
    return () => {
      cancelled = true;
    };
  }, [pgn, timeControl, worker]);

  useEffect(() => {
    if (!scrollContainerRef.current) return;

    if (currentMoveIndex === -1) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const activeMoveElement = scrollContainerRef.current.querySelector(
      '[data-active="true"]',
    );

    if (activeMoveElement) {
      activeMoveElement.scrollIntoView({
        behavior: "smooth",
      });
    } else {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [pairs.length, currentMoveIndex]);

  return (
    <div className="flex flex-col overflow-hidden w-100 h-60 scroll-smooth">
      <p className="text-zinc-300 text-[10px] font-bold tracking-widest uppercase px-1 pb-2 shrink-0 text-center">
        Move History
      </p>
      <div
        ref={scrollContainerRef}
        className={cn(
          "flex-1 overflow-y-auto p-2.5 space-y-0.5 bg-black-700 rounded-xs no-scrollbar",
        )}
      >
        {pairs.length === 0 ? (
          <p className="text-zinc-200 text-xs italic px-1 py-4 text-center">
            {live ? "Waiting for first move..." : "No moves to display."}
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
                  color="w"
                  onClick={onMoveClick}
                />

                {pair.black ? (
                  <MoveButton
                    move={pair.black}
                    isActive={currentMoveIndex === pair.black.index}
                    color="b"
                    onClick={onMoveClick}
                  />
                ) : (
                  <div className="ml-3 px-1.5 py-1 w-30" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});
