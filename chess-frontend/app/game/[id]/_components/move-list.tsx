import { useEffect, useRef } from "react";
import { Chess } from "chess.js";

interface MoveListProps {
    pgn: string;
    timeControl: string;
}

interface MoveDetail {
    san: string;
    timeSpent?: string;
}

interface MovePair {
    number: number;
    white: MoveDetail;
    black?: MoveDetail;
}

function clkToSeconds(clk: string): number {
    const match = clk.match(/(\d+):(\d{2}):(\d{2})/);
    if (!match) return 0;
    return parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]);
}

function parsePgnWithTimes(pgn: string, timeControl: string): MovePair[] {
    if (!pgn) return [];
    try {
        const chess = new Chess();
        chess.loadPgn(pgn);
        const history = chess.history();

        const clkMatches = [...pgn.matchAll(/\[%clk (\d+:\d{2}:\d{2})\]/g)].map(m => clkToSeconds(m[1]));

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

            const whiteDiff = whiteClk !== undefined ? lastWhiteClk - whiteClk + increment : undefined;
            const blackDiff = blackClk !== undefined ? lastBlackClk - blackClk + increment : undefined;

            pairs.push({
                number: Math.floor(i / 2) + 1,
                white: {
                    san: history[i],
                    timeSpent: whiteDiff !== undefined ? `${Math.max(0, whiteDiff)}s` : undefined
                },
                black: history[i + 1] ? {
                    san: history[i + 1],
                    timeSpent: blackDiff !== undefined ? `${Math.max(0, blackDiff)}s` : undefined
                } : undefined,
            });

            lastWhiteClk = whiteClk !== undefined ? whiteClk : lastWhiteClk;
            lastBlackClk = blackClk !== undefined ? blackClk : lastBlackClk;
        }
        return pairs;
    } catch {
        return [];
    }
}

export function MoveList({ pgn, timeControl }: MoveListProps) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const pairs = parsePgnWithTimes(pgn, timeControl);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [pairs.length]);

    return (
        <div className="flex flex-col h-full">
            <p className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase px-1 pb-2">
                Move History
            </p>
            <div className="flex-1 overflow-y-auto pr-1 space-y-0.5 scrollbar-thin bg-gray-900 rounded-md">
                {pairs.length === 0 ? (
                    <p className="text-zinc-200 text-xs italic px-1 py-4 text-center">Waiting for first move...</p>
                ) : (
                    pairs.map((pair) => (
                        <div key={pair.number} className="flex items-center text-sm group">
                            <span className="w-8 text-zinc-200 text-[10px] tabular-nums text-right pr-2">
                                {pair.number}.
                            </span>

                            <div className="flex-1 flex justify-between items-center px-2 py-1 hover:bg-zinc-800/50 rounded transition-colors group/m">
                                <span className="text-zinc-200 font-medium">{pair.white.san}</span>
                                {pair.white.timeSpent && (
                                    <span className="text-[9px] text-zinc-200 font-mono group-hover/m:opacity-100 transition-opacity">
                                        {pair.white.timeSpent}
                                    </span>
                                )}
                            </div>

                            {pair.black ? (
                                <div className="flex-1 flex justify-between items-center px-2 py-1 hover:bg-zinc-800/50 rounded transition-colors group/m">
                                    <span className="text-zinc-200 font-medium">{pair.black.san}</span>
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
                <div ref={bottomRef} />
            </div>
        </div>
    );
}