import { z } from "zod";
import {
  PlayerInfoSchema,
  GameStateUserSchema,
  GameStateUser,
  MoveMadeUserSchema,
} from "./player";

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

export enum QueueStatus {
  IDLE = "idle",
  WAITING = "waiting",
}

export enum PlayerColor {
  WHITE = "w",
  BLACK = "b",
}

export enum FullColor {
  WHITE = "white",
  BLACK = "black",
}

export enum DrawOffer {
  SENT = "sent",
  DECLINE = "decline",
}

export interface ActiveGame {
  gameId: string;
  fen: string;
  pgn: string;
  turn: PlayerColor;
  playerColor: PlayerColor;
  white: GameStateUser;
  black: GameStateUser;
  timeControl: string;
  status: GameStatus;
}

export const DrawOfferStateSchema = z.object({
  gameId: z.uuid(),

  offeredBy: z.string(),
});

export const RematchOfferStateSchema = z.object({
  gameId: z.uuid(),

  offeredBy: PlayerInfoSchema,
  timeControl: z.string(),
});

export const ChallengeOfferStateSchema = RematchOfferStateSchema.omit({
  gameId: true,
});

export type ChallengeOfferState = z.infer<typeof ChallengeOfferStateSchema>;
export type RematchOfferState = z.infer<typeof RematchOfferStateSchema>;

export type DrawOfferState = z.infer<typeof DrawOfferStateSchema>;

export const GameStartedPayloadSchema = z.object({
  gameId: z.uuid(),
  fen: z.string(),
  timeControl: z.string(),
  color: z.union([z.enum(FullColor), z.string()]),
  white: PlayerInfoSchema,
  black: PlayerInfoSchema,
});
export type GameStartedPayload = z.infer<typeof GameStartedPayloadSchema>;

export const GameStatePayloadSchema = z.object({
  gameId: z.uuid(),
  fen: z.string(),
  pgn: z.string(),
  turn: z.enum(PlayerColor),
  playerColor: z.enum(PlayerColor),
  status: z.enum(GameStatus),
  white: GameStateUserSchema,
  black: GameStateUserSchema,
  timeControl: z.string(),
});
export type GameStatePayload = z.infer<typeof GameStatePayloadSchema>;

export const MoveMadePayloadSchema = z.object({
  gameId: z.uuid(),
  fen: z.string(),
  pgn: z.string(),
  move: z.string(),
  white: MoveMadeUserSchema,
  black: MoveMadeUserSchema,
  isGameOver: z.boolean(),
});
export type MoveMadePayload = z.infer<typeof MoveMadePayloadSchema>;

export const GameOverStateSchema = z.object({
  status: z.enum(GameStatus),
  winnerId: z.string().optional(),
  reason: z.string().optional(),
});
export type GameOverState = z.infer<typeof GameOverStateSchema>;

export enum GameResult {
  d = "d",
  w = "w",
  b = "b",
}
