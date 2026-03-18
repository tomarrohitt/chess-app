import * as z from "zod";
import { RematchOfferStateSchema, WsMessageType } from "./types";

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

export const MakeMoveSchema = z.object({
  gameId: z.uuid(),
  from: z.string().regex(/^[a-h][1-8]$/),
  to: z.string().regex(/^[a-h][1-8]$/),
  promotion: z.enum(["q", "r", "b", "n"]).optional(),
});

export const GameIdOnlySchema = z.object({
  gameId: z.uuid(),
});

export const RematchOfferRequestSchema = z.object({
  gameId: z.string(),
  opponentId: z.string(),
  timeControl: z.string(),
});

export const WsMessageSchema = z.discriminatedUnion("type", [
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
    payload: RematchOfferRequestSchema,
  }),
  z.object({
    type: z.literal(WsMessageType.ACCEPT_REMATCH),
    payload: RematchOfferRequestSchema,
  }),
  z.object({
    type: z.literal(WsMessageType.DECLINE_REMATCH),
    payload: RematchOfferRequestSchema,
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
