import { z } from "zod";

export enum WsMessageType {
  JOIN_QUEUE = "JOIN_QUEUE",
  LEAVE_QUEUE = "LEAVE_QUEUE",
  QUEUE_JOINED = "QUEUE_JOINED",
  QUEUE_LEFT = "QUEUE_LEFT",
  MATCHMAKING_TIMEOUT = "MATCHMAKING_TIMEOUT",

  MAKE_MOVE = "MAKE_MOVE",
  MOVE_MADE = "MOVE_MADE",
  MOVE_ACCEPTED = "MOVE_ACCEPTED",
  MOVE_REJECTED = "MOVE_REJECTED",

  GAME_STARTED = "GAME_STARTED",
  GAME_ENDED = "GAME_ENDED",
  GAME_OVER = "GAME_OVER",

  OFFER_DRAW = "OFFER_DRAW",
  ACCEPT_DRAW = "ACCEPT_DRAW",
  DECLINE_DRAW = "DECLINE_DRAW",
  DRAW_OFFERED = "DRAW_OFFERED",

  OFFER_REMATCH = "OFFER_REMATCH",
  ACCEPT_REMATCH = "ACCEPT_REMATCH",
  DECLINE_REMATCH = "DECLINE_REMATCH",

  GAME_ABORTED = "GAME_ABORTED",
  RESIGN_GAME = "RESIGN_GAME",
  SYNC_GAME = "SYNC_GAME",
  GAME_STATE = "GAME_STATE",

  SPECTATE_GAME = "SPECTATE_GAME",
  LEAVE_SPECTATOR = "LEAVE_SPECTATOR",
  ERROR = "ERROR",
}

export enum GameStatus {
  IN_PROGRESS = "IN_PROGRESS",
  CHECKMATE = "CHECKMATE",
  RESIGN = "RESIGN",
  DRAW = "DRAW",
  AGREEMENT = "AGREEMENT",
  STALEMATE = "STALEMATE",
  INSUFFICIENT_MATERIAL = "INSUFFICIENT_MATERIAL",
  FIFTY_MOVE_RULE = "FIFTY_MOVE_RULE",
  THREEFOLD_REPETITION = "THREEFOLD_REPETITION",
  TIME_OUT = "TIME_OUT",
  ABANDONED = "ABANDONED",
}

export enum GameResult {
  d = "d",
  w = "w",
  b = "b",
}

export enum PLAYER_COLOR {
  WHITE = "w",
  BLACK = "b",
}

export enum COLOR {
  WHITE = "white",
  BLACK = "black",
}

export const PlayerInfoSchema = z.object({
  id: z.string(),
  username: z.string(),
  rating: z.number(),
  image: z.string().nullish(),
});

export type PlayerInfo = z.infer<typeof PlayerInfoSchema>;

export const RematchOfferStateSchema = z.object({
  gameId: z.string(),
  offeredBy: PlayerInfoSchema,
  timeControl: z.string(),
});

export type RematchOfferState = z.infer<typeof RematchOfferStateSchema>;

export const GameUserSchema = PlayerInfoSchema.extend({
  timeLeftMs: z.number().optional(),
  capturedPieces: z.array(z.string()).default([]).optional(),
});

export type GameUser = z.infer<typeof GameUserSchema>;

export const GameSyncStateSchema = z.object({
  gameId: z.uuid(),
  fen: z.string(),
  pgn: z.string(),
  playerColor: z.enum(PLAYER_COLOR),
  turn: z.enum(PLAYER_COLOR),
  status: z.enum(GameStatus),
  white: GameUserSchema,
  black: GameUserSchema,
  timeControl: z.string(),
});
export type GameSyncState = z.infer<typeof GameSyncStateSchema>;
