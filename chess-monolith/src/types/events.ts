import * as z from "zod";
import {
  GameIdOnlySchema,
  MakeMoveSchema,
  RematchRequestSchema,
  WsMessageType,
} from "./types";

const EmptyPayload = z.undefined();

export const JoinQueueSchema = z.object({
  timeControl: z.enum([
    "1+0",
    "1+1",
    "2+1",
    "3+0",
    "3+2",
    "5+0",
    "5+3",
    "10+0",
    "10+5",
    "15+10",
    "30+0",
    "30+20",
    "60+0",
    "90+30",
  ]),
});

export const ChallengeOfferStateSchema = z.object({
  targetId: z.string(),
  timeControl: z.string(),
});

export type ChallengeOfferState = z.infer<typeof ChallengeOfferStateSchema>;

export const WsMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(WsMessageType.SEND_CHAT_MESSAGE),
    payload: z.object({
      receiverId: z.string(),
      content: z.string().min(1),
    }),
  }),
  z.object({
    type: z.literal(WsMessageType.SEND_GAME_CHAT),
    payload: z.object({
      gameId: z.string().uuid(),
      content: z.string().min(1).max(500),
    }),
  }),
  z.object({
    type: z.literal(WsMessageType.CHAT_TYPING),
    payload: z.object({
      receiverId: z.string(),
      isTyping: z.boolean(),
    }),
  }),
  z.object({
    type: z.literal(WsMessageType.JOIN_QUEUE),
    payload: JoinQueueSchema,
  }),
  z.object({
    type: z.literal(WsMessageType.MAKE_MOVE),
    payload: MakeMoveSchema,
  }),
  z.object({
    type: z.literal(WsMessageType.RESIGN_GAME),
    payload: GameIdOnlySchema,
  }),
  z.object({
    type: z.literal(WsMessageType.JOIN_GAME_CHAT),
    payload: GameIdOnlySchema,
  }),
  z.object({
    type: z.literal(WsMessageType.LEAVE_GAME_CHAT),
    payload: GameIdOnlySchema,
  }),
  z.object({
    type: z.literal(WsMessageType.GAME_ABORTED),
    payload: GameIdOnlySchema,
  }),
  z.object({
    type: z.literal(WsMessageType.OFFER_DRAW),
    payload: GameIdOnlySchema,
  }),
  z.object({
    type: z.literal(WsMessageType.ACCEPT_DRAW),
    payload: GameIdOnlySchema,
  }),
  z.object({
    type: z.literal(WsMessageType.DECLINE_DRAW),
    payload: GameIdOnlySchema,
  }),
  z.object({
    type: z.literal(WsMessageType.OFFER_REMATCH),
    payload: RematchRequestSchema,
  }),
  z.object({
    type: z.literal(WsMessageType.ACCEPT_REMATCH),
    payload: RematchRequestSchema,
  }),
  z.object({
    type: z.literal(WsMessageType.DECLINE_REMATCH),
    payload: RematchRequestSchema,
  }),
  z.object({
    type: z.literal(WsMessageType.OFFER_CHALLENGE),
    payload: ChallengeOfferStateSchema,
  }),
  z.object({
    type: z.literal(WsMessageType.ACCEPT_CHALLENGE),
    payload: ChallengeOfferStateSchema,
  }),
  z.object({
    type: z.literal(WsMessageType.DECLINE_CHALLENGE),
    payload: ChallengeOfferStateSchema,
  }),
  z.object({
    type: z.literal(WsMessageType.LEAVE_QUEUE),
    payload: EmptyPayload,
  }),
  z.object({
    type: z.literal(WsMessageType.SYNC_GAME),
    payload: EmptyPayload,
  }),
  z.object({
    type: z.literal(WsMessageType.SPECTATE_GAME),
    payload: GameIdOnlySchema,
  }),
  z.object({
    type: z.literal(WsMessageType.LEAVE_SPECTATOR),
    payload: GameIdOnlySchema,
  }),
]);

export type WsMessage = z.infer<typeof WsMessageSchema>;
