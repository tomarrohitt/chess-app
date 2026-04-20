import { Request, Response } from "express";
import { z } from "zod";
import { getUserById } from "../repository/user-repository";

const UserParamsSchema = z.object({
  id: z.uuid(),
});

export async function getUserByIdHandler(req: Request, res: Response) {
  const params = UserParamsSchema.safeParse(req.params);
  if (!params.success) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  const data = await getUserById(params.data.id);

  return res.json({ success: true, data });
}
