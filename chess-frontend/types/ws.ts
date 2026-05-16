import { z } from "zod";
import { BaseMessageSchema, GameChatMessageSchema } from "./chat";
import {
  GameStartedPayloadSchema,
  GameStatePayloadSchema,
  MoveMadePayloadSchema,
  GameOverStateSchema,
  DrawOfferStateSchema,
  RematchOfferStateSchema,
  ChallengeOfferStateSchema,
  QueueStatus,
} from "./chess";
import { PlayerConnectionPayloadSchema } from "./player";

export enum WsMessageType {
  AUTH_SUCCESS = "AUTH_SUCCESS",
  AUTH = "AUTH",

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
  OFFER_CHALLENGE = "OFFER_CHALLENGE",
  ACCEPT_CHALLENGE = "ACCEPT_CHALLENGE",
  DECLINE_CHALLENGE = "DECLINE_CHALLENGE",
  CHALLENGE_RECEIVED = "CHALLENGE_RECEIVED",
  CHALLENGE_DECLINED = "CHALLENGE_DECLINED",

  SEND_GAME_CHAT = "SEND_GAME_CHAT",
  NEW_GAME_CHAT = "NEW_GAME_CHAT",
  RECEIVE_CHAT_MESSAGE = "RECEIVE_CHAT_MESSAGE",
  CHAT_MESSAGE_ACK = "CHAT_MESSAGE_ACK",
  MARK_CHAT_READ = "MARK_CHAT_READ",
  MARK_ALL_CHATS_READ = "MARK_ALL_CHATS_READ",

  SEND_CHAT_MESSAGE = "SEND_CHAT_MESSAGE",

  JOIN_GAME_CHAT = "JOIN_GAME_CHAT",
  LEAVE_GAME_CHAT = "LEAVE_GAME_CHAT",

  PING = "PING",
  PONG = "PONG",
  ERROR = "ERROR",
  PLAYER_RECONNECTED = "PLAYER_RECONNECTED",
  PLAYER_DISCONNECTED = "PLAYER_DISCONNECTED",
}

export enum WsConnectionStatus {
  IDLE = "idle",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  FAILED = "failed",
}

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
    payload: z.object({ gameId: z.uuid() }),
  }),
  z.object({
    type: z.literal(WsMessageType.DECLINE_DRAW),
    payload: z.object({ gameId: z.uuid(), message: z.string().optional() }),
  }),
  z.object({
    type: z.literal(WsMessageType.GAME_ABORTED),
    payload: z.object({
      gameId: z.uuid().optional(),
      reason: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal(WsMessageType.OFFER_REMATCH),
    payload: RematchOfferStateSchema,
  }),
  z.object({
    type: z.literal(WsMessageType.ACCEPT_REMATCH),
    payload: z.object({ gameId: z.uuid() }),
  }),
  z.object({
    type: z.literal(WsMessageType.DECLINE_REMATCH),
    payload: z.object({ gameId: z.uuid(), message: z.string().optional() }),
  }),
  z.object({
    type: z.literal(WsMessageType.SPECTATE_GAME),
    payload: z.object({ gameId: z.uuid() }),
  }),
  z.object({
    type: z.literal(WsMessageType.LEAVE_SPECTATOR),
    payload: z.object({ gameId: z.uuid() }),
  }),
  z.object({
    type: z.literal(WsMessageType.CHALLENGE_RECEIVED),
    payload: ChallengeOfferStateSchema,
  }),
  z.object({
    type: z.literal(WsMessageType.CHALLENGE_DECLINED),
    payload: ChallengeOfferStateSchema.optional(),
  }),
  z.object({
    type: z.literal(WsMessageType.QUEUE_JOINED),
    payload: z.object({
      status: z.enum(QueueStatus),
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
    type: z.literal(WsMessageType.NEW_GAME_CHAT),
    payload: GameChatMessageSchema,
  }),
  z.object({
    type: z.literal(WsMessageType.SEND_CHAT_MESSAGE),
    payload: z.object({
      receiverId: z.string(),
      content: z.string().min(1),
    }),
  }),
  z.object({
    type: z.literal(WsMessageType.RECEIVE_CHAT_MESSAGE),
    payload: BaseMessageSchema,
  }),
  z.object({
    type: z.literal(WsMessageType.CHAT_MESSAGE_ACK),
    payload: BaseMessageSchema,
  }),

  z.object({
    type: z.literal(WsMessageType.PLAYER_RECONNECTED),
    payload: PlayerConnectionPayloadSchema,
  }),
  z.object({
    type: z.literal(WsMessageType.PLAYER_DISCONNECTED),
    payload: PlayerConnectionPayloadSchema,
  }),
  z.object({
    type: z.literal(WsMessageType.ERROR),
    payload: z.union([z.string(), z.object({ message: z.string() })]),
  }),
  z.object({
    type: z.literal(WsMessageType.PING),
  }),
  z.object({
    type: z.literal(WsMessageType.PONG),
  }),
  z.object({
    type: z.literal(WsMessageType.AUTH_SUCCESS),
  }),
  z.object({
    type: z.literal(WsMessageType.AUTH),
  }),
]);

export type ServerMessage = z.infer<typeof ServerMessageSchema>;
