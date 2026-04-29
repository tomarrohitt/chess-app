import { expose } from "comlink";

import { Chess, Square } from "chess.js";

function clkToSeconds(clk: string): number {
  const match = clk.match(/(\d+):(\d{2}):(\d+(?:\.\d+)?)/);

  if (!match) return 0;

  return (
    parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseFloat(match[3])
  );
}

function clkToMs(clk: string): number {
  return clkToSeconds(clk) * 1000;
}

export interface MovePair {
  number: number;

  white: { san: string; timeSpent?: string; index: number };

  black?: { san: string; timeSpent?: string; index: number };
}

export interface CapturedPieces {
  capturedByWhite: string[];

  capturedByBlack: string[];
}

export interface TimesResult {
  whiteTimeLeftMs: number;

  blackTimeLeftMs: number;
}

export type MoveOptions = Record<
  string,
  { background: string; borderRadius?: string }
> | null;

const chessWorker = {
  getTimelineCache(pgn: string, timeControl?: string) {
    const initialFen =
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    let initialMs = 300000;

    if (timeControl) {
      const [mins] = timeControl.split("+").map(Number);

      if (!isNaN(mins)) initialMs = mins * 60 * 1000;
    }

    const initialTimes = {
      whiteTimeLeftMs: initialMs,

      blackTimeLeftMs: initialMs,
    };

    const initialCaptured = { capturedByWhite: [], capturedByBlack: [] };

    if (!pgn) {
      return {
        pgn: "",

        history: [],

        fens: [initialFen],

        times: [initialTimes],

        captured: [initialCaptured],
      };
    }

    try {
      const chess = new Chess();

      chess.loadPgn(pgn);

      const history = chess.history();

      const verboseHistory = chess.history({ verbose: true });

      const fens = [initialFen, ...verboseHistory.map((m) => m.after)];

      const captured = fens.map((fen) => chessWorker.getCapturedPieces(fen));

      const clkMatches = [
        ...pgn.matchAll(/\[%clk (\d+:\d{2}:\d+(?:\.\d+)?)\]/g),
      ].map((m) => clkToMs(m[1]));

      const times: TimesResult[] = [initialTimes];

      let lastWhiteMs = initialMs;

      let lastBlackMs = initialMs;

      for (let i = 0; i < history.length; i++) {
        if (i % 2 === 0) {
          if (clkMatches[i] !== undefined) lastWhiteMs = clkMatches[i];
        } else {
          if (clkMatches[i] !== undefined) lastBlackMs = clkMatches[i];
        }

        times.push({
          whiteTimeLeftMs: lastWhiteMs,

          blackTimeLeftMs: lastBlackMs,
        });
      }

      return { pgn, history, fens, times, captured };
    } catch {
      return {
        pgn,

        history: [],

        fens: [initialFen],

        times: [initialTimes],

        captured: [initialCaptured],
      };
    }
  },

  parsePgnWithTimes(pgn: string, timeControl: string): MovePair[] {
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
  },

  getTimesAtMove(
    pgn: string,

    timeControl: string,

    currentMoveIndex: number,
  ): TimesResult {
    let initialMs = 300000;

    if (timeControl) {
      const [mins] = timeControl.split("+").map(Number);

      if (!isNaN(mins)) initialMs = mins * 60 * 1000;
    }

    if (!pgn || currentMoveIndex === -1) {
      return { whiteTimeLeftMs: initialMs, blackTimeLeftMs: initialMs };
    }

    const clkMatches = [
      ...pgn.matchAll(/\[%clk (\d+:\d{2}:\d+(?:\.\d+)?)\]/g),
    ].map((m) => clkToMs(m[1]));

    let whiteTimeLeftMs = initialMs;

    let blackTimeLeftMs = initialMs;

    const latestWhiteIndex =
      currentMoveIndex % 2 === 0 ? currentMoveIndex : currentMoveIndex - 1;

    const latestBlackIndex =
      currentMoveIndex % 2 === 1 ? currentMoveIndex : currentMoveIndex - 1;

    if (latestWhiteIndex >= 0 && clkMatches[latestWhiteIndex] !== undefined) {
      whiteTimeLeftMs = clkMatches[latestWhiteIndex];
    }

    if (latestBlackIndex >= 0 && clkMatches[latestBlackIndex] !== undefined) {
      blackTimeLeftMs = clkMatches[latestBlackIndex];
    }

    return { whiteTimeLeftMs, blackTimeLeftMs };
  },

  getCapturedPieces(fen: string): CapturedPieces {
    const counts: Record<string, number> = {
      p: 0,

      n: 0,

      b: 0,

      r: 0,

      q: 0,

      P: 0,

      N: 0,

      B: 0,

      R: 0,

      Q: 0,
    };

    const initialCounts: Record<string, number> = {
      p: 8,

      n: 2,

      b: 2,

      r: 2,

      q: 1,

      P: 8,

      N: 2,

      B: 2,

      R: 2,

      Q: 1,
    };

    const position = fen.split(" ")[0];

    for (const char of position) {
      if (counts[char] !== undefined) counts[char]++;
    }

    const capturedByWhite: string[] = [];

    const capturedByBlack: string[] = [];

    ["p", "n", "b", "r", "q"].forEach((piece) => {
      const diff = initialCounts[piece] - counts[piece];

      for (let i = 0; i < diff; i++) capturedByWhite.push(piece);
    });

    ["P", "N", "B", "R", "Q"].forEach((piece) => {
      const diff = initialCounts[piece] - counts[piece];

      for (let i = 0; i < diff; i++) capturedByBlack.push(piece);
    });

    return { capturedByWhite, capturedByBlack };
  },

  getValidMoveOptions(fen: string, square: string): MoveOptions {
    try {
      const game = new Chess(fen);

      const moves = game.moves({ square: square as Square, verbose: true });

      if (moves.length === 0) return null;

      const newSquares: Record<
        string,
        { background: string; borderRadius?: string }
      > = {};

      for (const move of moves) {
        const isCapture =
          game.get(move.to as Square) &&
          game.get(move.to as Square)?.color !==
            game.get(square as Square)?.color;

        newSquares[move.to] = {
          background: isCapture
            ? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)"
            : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",

          borderRadius: "50%",
        };
      }

      newSquares[square] = { background: "rgba(255, 255, 0, 0.4)" };

      return newSquares;
    } catch {
      return null;
    }
  },
};

expose(chessWorker);

export type IChessWorker = typeof chessWorker;
