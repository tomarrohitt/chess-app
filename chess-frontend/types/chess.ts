import { z } from "zod";

export enum WsMessageType {
  JOIN_QUEUE = "JOIN_QUEUE",
  LEAVE_QUEUE = "LEAVE_QUEUE",
  QUEUE_JOINED = "QUEUE_JOINED",
  QUEUE_LEFT = "QUEUE_LEFT",
  MAKE_MOVE = "MAKE_MOVE",
  MOVE_MADE = "MOVE_MADE",
  MOVE_ACCEPTED = "MOVE_ACCEPTED",
  MOVE_REJECTED = "MOVE_REJECTED",
  MATCHMAKING_TIMEOUT = "MATCHMAKING_TIMEOUT",
  GAME_STARTED = "GAME_STARTED",
  GAME_ENDED = "GAME_ENDED",
  GAME_OVER = "GAME_OVER",
  OFFER_DRAW = "OFFER_DRAW",
  ACCEPT_DRAW = "ACCEPT_DRAW",
  DECLINE_DRAW = "DECLINE_DRAW",
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

export type WsConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected";
export enum WS_CONNECTION_STATUS {
  IDLE = "idle",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
}

export type QueueStatus = "idle" | "waiting";

export enum QUEUE_STATUS {
  IDLE = "idle",
  WAITING = "waiting",
}

export enum PLAYER_COLOR {
  WHITE = "w",
  BLACK = "b",
}

export enum COLOR {
  WHITE = "white",
  BLACK = "black",
}

export enum DRAW_OFFER {
  SENT = "sent",
  DECLINE = "decline",
}

export interface ActiveGame {
  gameId: string;
  fen: string;
  pgn: string;
  turn: PLAYER_COLOR;
  playerColor: PLAYER_COLOR;
  white: GameStateUser;
  black: GameStateUser;
  timeControl: string;
  status: GameStatus;
}

export const PlayerInfoSchema = z.object({
  id: z.string(),
  username: z.string(),
  rating: z.number(),
  image: z.string().nullable(),
});
export type PlayerInfo = z.infer<typeof PlayerInfoSchema>;

export const DrawOfferStateSchema = z.object({
  gameId: z.string(),
  offeredBy: z.string(),
});

export const RematchOfferStateSchema = z.object({
  gameId: z.string(),
  offeredBy: PlayerInfoSchema,
  timeControl: z.string(),
});

export type RematchOfferState = z.infer<typeof RematchOfferStateSchema>;

export type DrawOfferState = z.infer<typeof DrawOfferStateSchema>;

export const GameStateUserSchema = PlayerInfoSchema.extend({
  timeLeftMs: z.number(),
  capturedPieces: z.array(z.string()).optional().default([]),
});

export type GameStateUser = z.infer<typeof GameStateUserSchema>;

export const MoveMadeUserSchema = z.object({
  id: z.string(),
  timeLeftMs: z.number(),
  capturedPieces: z.array(z.string()).optional().default([]),
});

export const GameStartedPayloadSchema = z.object({
  gameId: z.string(),
  fen: z.string(),
  timeControl: z.string(),
  color: z.union([z.enum(COLOR), z.string()]),
  white: PlayerInfoSchema,
  black: PlayerInfoSchema,
});
export type GameStartedPayload = z.infer<typeof GameStartedPayloadSchema>;

export const GameStatePayloadSchema = z.object({
  gameId: z.string(),
  fen: z.string(),
  pgn: z.string(),
  turn: z.enum(PLAYER_COLOR),
  playerColor: z.enum(PLAYER_COLOR),
  status: z.enum(GameStatus),
  white: GameStateUserSchema,
  black: GameStateUserSchema,
  timeControl: z.string(),
});
export type GameStatePayload = z.infer<typeof GameStatePayloadSchema>;

export const MoveMadePayloadSchema = z.object({
  gameId: z.string(),
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

export const ServerMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(WsMessageType.GAME_STARTED),
    payload: GameStartedPayloadSchema,
  }),
  z.object({
    type: z.literal(WsMessageType.GAME_STATE),
    payload: GameStatePayloadSchema,
  }),
  z.object({
    type: z.literal(WsMessageType.MOVE_MADE),
    payload: MoveMadePayloadSchema,
  }),
  z.object({
    type: z.literal(WsMessageType.MOVE_REJECTED),
    payload: z.object({ reason: z.string() }),
  }),
  z.object({
    type: z.literal(WsMessageType.GAME_OVER),
    payload: GameOverStateSchema,
  }),
  z.object({
    type: z.literal(WsMessageType.OFFER_DRAW),
    payload: DrawOfferStateSchema,
  }),
  z.object({
    type: z.literal(WsMessageType.ACCEPT_DRAW),
    payload: z.object({ gameId: z.string() }),
  }),
  z.object({
    type: z.literal(WsMessageType.DECLINE_DRAW),
    payload: z.object({ gameId: z.string(), message: z.string().optional() }),
  }),
  z.object({
    type: z.literal(WsMessageType.GAME_ABORTED),
    payload: z.object({
      gameId: z.string().optional(),
      reason: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal(WsMessageType.OFFER_REMATCH),
    payload: RematchOfferStateSchema,
  }),
  z.object({
    type: z.literal(WsMessageType.ACCEPT_REMATCH),
    payload: z.object({ gameId: z.string() }),
  }),
  z.object({
    type: z.literal(WsMessageType.DECLINE_REMATCH),
    payload: z.object({ gameId: z.string(), message: z.string().optional() }),
  }),
  z.object({
    type: z.literal(WsMessageType.SPECTATE_GAME),
    payload: z.object({ gameId: z.string() }),
  }),
  z.object({
    type: z.literal(WsMessageType.LEAVE_SPECTATOR),
    payload: z.object({ gameId: z.string() }),
  }),
  z.object({
    type: z.literal(WsMessageType.QUEUE_JOINED),
    payload: z.object({
      status: z.enum(["waiting", "idle"]),
      timeControl: z.string(),
    }),
  }),
  z.object({
    type: z.literal(WsMessageType.QUEUE_LEFT),
    payload: z.unknown().optional(),
  }),
  z.object({
    type: z.literal(WsMessageType.MATCHMAKING_TIMEOUT),
    payload: z.object({ message: z.string() }),
  }),
  z.object({
    type: z.literal(WsMessageType.ERROR),
    payload: z.union([z.string(), z.object({ message: z.string() })]),
  }),
]);

export type ServerMessage = z.infer<typeof ServerMessageSchema>;

export enum GameResult {
  d = "d",
  w = "w",
  b = "b",
}
