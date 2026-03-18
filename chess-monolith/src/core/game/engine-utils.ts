import { Chess } from "chess.js";
import { GameState, getIncrementMs } from "../../lib/state";
import { GameStatus, PLAYER_COLOR } from "../../types/types";
import { NotYourTurnError, IllegalMoveError } from "../../lib/errors";

export function formatPgnTime(ms: number): string {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `0:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function getCapturedPieces(fen: string) {
  const startingPieces = {
    w: { Q: 1, R: 2, B: 2, N: 2, P: 8 },
    b: { q: 1, r: 2, b: 2, n: 2, p: 8 },
  };

  const boardFen = fen.split(" ")[0];

  const currentPieces = {
    w: { Q: 0, R: 0, B: 0, N: 0, P: 0 },
    b: { q: 0, r: 0, b: 0, n: 0, p: 0 },
  };

  for (const char of boardFen) {
    if (char in currentPieces.w)
      currentPieces.w[char as keyof typeof currentPieces.w]++;
    if (char in currentPieces.b)
      currentPieces.b[char as keyof typeof currentPieces.b]++;
  }

  const capturedByWhite: string[] = [];
  const capturedByBlack: string[] = [];

  for (const [piece, count] of Object.entries(startingPieces.b)) {
    const missing =
      count - currentPieces.b[piece as keyof typeof currentPieces.b];
    for (let i = 0; i < missing; i++) capturedByWhite.push(piece);
  }

  for (const [piece, count] of Object.entries(startingPieces.w)) {
    const missing =
      count - currentPieces.w[piece as keyof typeof currentPieces.w];
    for (let i = 0; i < missing; i++) capturedByBlack.push(piece);
  }

  return {
    capturedByWhite,
    capturedByBlack,
  };
}

export function validateTurn(state: GameState, userId: string): boolean {
  if (userId !== state.white.id && userId !== state.black.id) {
    throw new Error("Spectators cannot make moves.");
  }

  const isWhiteTurn = state.turn === PLAYER_COLOR.WHITE;
  const expectedId = isWhiteTurn ? state.white.id : state.black.id;
  if (userId !== expectedId) throw new NotYourTurnError();
  return isWhiteTurn;
}

export function calculateClocks(state: GameState, now: number) {
  const elapsed = now - state.lastMoveTimestamp;
  const incMs = getIncrementMs(state.timeControl);
  const isWhiteTurn = state.turn === PLAYER_COLOR.WHITE;

  let whiteTime = state.white.timeLeftMs ?? 0;
  let blackTime = state.black.timeLeftMs ?? 0;

  let isTimeout = false;

  if (isWhiteTurn) {
    whiteTime -= elapsed;
    if (whiteTime <= 0) isTimeout = true;
    else whiteTime += incMs;
  } else {
    blackTime -= elapsed;
    if (blackTime <= 0) isTimeout = true;
    else blackTime += incMs;
  }

  return { whiteTime, blackTime, elapsed, isTimeout };
}

export function applyMove(
  state: GameState,
  from: string,
  to: string,
  remainingTimeMs: number,
  promotion?: string,
): { chess: Chess; san: string } {
  const chess = new Chess();
  if (state.pgn) chess.loadPgn(state.pgn);

  try {
    const result = chess.move({ from, to, promotion });
    chess.setComment(`[%clk ${formatPgnTime(remainingTimeMs)}]`);
    return { chess, san: result.san };
  } catch {
    throw new IllegalMoveError();
  }
}

export function resolveOutcome(
  chess: Chess,
  state: GameState,
): { status: GameStatus; winnerId?: string; isOver: boolean; reason?: string } {
  if (!chess.isGameOver())
    return { status: GameStatus.IN_PROGRESS, isOver: false };

  if (chess.isCheckmate()) {
    const whiteWon = chess.turn() === PLAYER_COLOR.BLACK;
    const winnerId = whiteWon ? state.white.id : state.black.id;
    return {
      status: GameStatus.CHECKMATE,
      winnerId,
      isOver: true,
      reason: "checkmate",
    };
  }

  if (chess.isStalemate())
    return { status: GameStatus.STALEMATE, isOver: true, reason: "stalemate" };
  if (chess.isInsufficientMaterial())
    return {
      status: GameStatus.INSUFFICIENT_MATERIAL,
      isOver: true,
      reason: "insufficient material",
    };
  if (chess.isThreefoldRepetition())
    return {
      status: GameStatus.THREEFOLD_REPETITION,
      isOver: true,
      reason: "repetition",
    };
  if (chess.isDraw())
    return {
      status: GameStatus.FIFTY_MOVE_RULE,
      isOver: true,
      reason: "50-move rule",
    };

  return { status: GameStatus.DRAW, isOver: true, reason: "draw" };
}
