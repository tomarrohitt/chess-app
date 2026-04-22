import { Request, Response } from "express";
import {
  getGameDetails,
  getUserMatchHistory,
} from "../repository/game-repository";
import { GameIdOnlySchema } from "../../types/types";
import z from "zod";

const HistorySchema = z.object({
  id: z.string(),
});

export async function getUserMatchDetail(req: Request, res: Response) {
  const { gameId } = req.params;

  const result = GameIdOnlySchema.safeParse({ gameId });

  if (!result.success) {
    return res.status(404).json({ success: false, error: "Game not found" });
  }

  const game = await getGameDetails(result.data.gameId);

  if (!game) {
    return res.status(404).json({ success: false, error: "Game not found" });
  }

  return res.json({ success: true, data: game });
}

export async function getUserMatches(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    const result = HistorySchema.safeParse(req.params);

    if (!result.success) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    const history = await getUserMatchHistory(result.data.id, limit);

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error(`[History Endpoint] Error for user ${req.user.id}:`, error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
