import {
  GameStatus,
  GameUser,
  GameUserSchema,
  PLAYER_COLOR,
} from "../types/types";
import { GameNotFoundError } from "./errors";

export interface GameState {
  white: GameUser;
  black: GameUser;
  fen: string;
  pgn: string;
  status: string;
  turn: PLAYER_COLOR;
  timeControl: string;
  lastMoveTimestamp: number;
}

export function parseGameState(
  raw: Record<string, string | undefined>,
  gameId: string,
): GameState {
  function require(field: string): string {
    const value = raw[field];
    if (!value) throw new GameNotFoundError(gameId);
    return value;
  }

  const whiteUserStr = require("whiteUser");
  const blackUserStr = require("blackUser");
  const fen = require("fen");
  const timeControl = require("timeControl");
  const rawTurn = require("turn");
  const rawLastMove = require("lastMoveTimestamp");

  const whiteUser = GameUserSchema.parse(JSON.parse(whiteUserStr));
  const blackUser = GameUserSchema.parse(JSON.parse(blackUserStr));
  const lastMoveTimestamp = parseInt(rawLastMove, 10);

  if (isNaN(lastMoveTimestamp)) {
    throw new GameNotFoundError(gameId);
  }

  return {
    white: {
      ...whiteUser,
      timeLeftMs: whiteUser.timeLeftMs ?? 0,
    },
    black: {
      ...blackUser,
      timeLeftMs: blackUser.timeLeftMs ?? 0,
    },
    fen,
    pgn: raw.pgn ?? "",
    status: raw.status ?? GameStatus.IN_PROGRESS,
    turn: rawTurn as PLAYER_COLOR,
    timeControl,
    lastMoveTimestamp,
  };
}

export function getIncrementMs(timeControl: string): number {
  const inc = parseInt(timeControl.split("+")[1] ?? "0", 10);
  return isNaN(inc) ? 0 : inc * 1000;
}
