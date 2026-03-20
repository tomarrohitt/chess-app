import { Request, Response } from "express";
import { auth } from "../../lib/auth";
import {
  getGameDetails,
  getUserMatchHistory,
} from "../repository/game-repository";
import { toFetchHeaders } from "../../lib/utils/to-fetch-headers";
import { GameIdOnlySchema } from "../../types/types";

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
    const session = await auth.api.getSession({
      headers: toFetchHeaders(req.headers),
    });

    if (!session?.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const userId = session.user.id;

    const history = await getUserMatchHistory(userId, limit);

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error(`[History Endpoint] Error for user ${req.user.id}:`, error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
