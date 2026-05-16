import * as z from "zod";

export enum WsMessageType {
  SEND_GAME_CHAT = "SEND_GAME_CHAT",

  JOIN_GAME_CHAT = "JOIN_GAME_CHAT",
  NEW_GAME_CHAT = "NEW_GAME_CHAT",
  LEAVE_GAME_CHAT = "LEAVE_GAME_CHAT",

  SEND_CHAT_MESSAGE = "SEND_CHAT_MESSAGE",
  RECEIVE_CHAT_MESSAGE = "RECEIVE_CHAT_MESSAGE",
  CHAT_MESSAGE_ACK = "CHAT_MESSAGE_ACK",
  MARK_CHAT_READ = "MARK_CHAT_READ",
  MARK_ALL_CHATS_READ = "MARK_ALL_CHATS_READ",
  CHAT_READ_RECEIPT = "CHAT_READ_RECEIPT",
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

  OFFER_CHALLENGE = "OFFER_CHALLENGE",
  ACCEPT_CHALLENGE = "ACCEPT_CHALLENGE",
  DECLINE_CHALLENGE = "DECLINE_CHALLENGE",
  CHALLENGE_RECEIVED = "CHALLENGE_RECEIVED",
  CHALLENGE_DECLINED = "CHALLENGE_DECLINED",

  GAME_ABORTED = "GAME_ABORTED",
  RESIGN_GAME = "RESIGN_GAME",
  SYNC_GAME = "SYNC_GAME",
  GAME_STATE = "GAME_STATE",

  SPECTATE_GAME = "SPECTATE_GAME",
  LEAVE_SPECTATOR = "LEAVE_SPECTATOR",

  PING = "PING",
  PONG = "PONG",
  ERROR = "ERROR",
  AUTH = "AUTH",
  AUTH_SUCCESS = "AUTH_SUCCESS",
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

export const MakeMoveSchema = z.object({
  gameId: z.uuid(),
  from: z.string().regex(/^[a-h][1-8]$/),
  to: z.string().regex(/^[a-h][1-8]$/),
  promotion: z.enum(["q", "r", "b", "n"]).optional(),
});

export const GameIdOnlySchema = z.object({
  gameId: z.uuid(),
});

export const PlayerInfoSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  rating: z.number(),
  image: z.string().nullable(),
});
export const ChatUserSchema = PlayerInfoSchema.extend({
  name: z.string(),
});

export type ChatMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Date;
};

export type PlayerInfo = z.infer<typeof PlayerInfoSchema>;
export type ChatUserInfo = z.infer<typeof ChatUserSchema>;

export const GameChatMessageSchema = z.object({
  id: z.uuid(),
  gameId: z.uuid(),
  sender: PlayerInfoSchema,
  content: z.string(),
  createdAt: z.string(),
});

export type InboxChatMessage = {
  user: PlayerInfo;
  lastMessage: ChatMessage;
};

export type GameChatMessage = z.infer<typeof GameChatMessageSchema>;

export const RematchRequestSchema = z.object({
  gameId: z.uuid(),
  timeControl: z.string(),
});

export type RematchRequest = z.infer<typeof RematchRequestSchema>;

export const RematchEventSchema = z.object({
  gameId: z.uuid(),
  offeredBy: PlayerInfoSchema,
  timeControl: z.string(),
});

export type RematchEvent = z.infer<typeof RematchEventSchema>;

export const GameUserSchema = PlayerInfoSchema.extend({
  timeLeftMs: z.number().optional(),
  capturedPieces: z.array(z.string()).default([]),
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
  chatMessages: z.array(GameChatMessageSchema),
});
export type GameSyncState = z.infer<typeof GameSyncStateSchema>;
