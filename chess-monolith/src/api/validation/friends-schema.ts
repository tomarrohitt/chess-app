import z from "zod";

export const TargetUserIdSchema = z.object({
  userId: z.uuid(),
});
