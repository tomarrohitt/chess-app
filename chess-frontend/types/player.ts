import { z } from "zod";

export const PlayerInfoSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  rating: z.number(),
  image: z.string().nullable(),
});

export type PlayerInfo = z.infer<typeof PlayerInfoSchema>;

export const GameStateUserSchema = PlayerInfoSchema.extend({
  timeLeftMs: z.number(),
  capturedPieces: z.array(z.string()).optional().default([]),
});

export type GameStateUser = z.infer<typeof GameStateUserSchema>;

export const MoveMadeUserSchema = z.object({
  id: z.uuid(),
  timeLeftMs: z.number(),
  capturedPieces: z.array(z.string()).optional().default([]),
});
export type MoveMadeUser = z.infer<typeof MoveMadeUserSchema>;

export const PlayerConnectionPayloadSchema = z.object({
  color: z.string(),
  userId: z.uuid(),
});
export type PlayerConnectionPayload = z.infer<
  typeof PlayerConnectionPayloadSchema
>;
