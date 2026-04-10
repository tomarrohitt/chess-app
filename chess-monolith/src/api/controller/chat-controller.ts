import { Request, Response } from "express";
import { auth } from "../../lib/auth";
import { toFetchHeaders } from "../../lib/utils/to-fetch-headers";
import {
  getChatHistory,
  getRecentConversations,
} from "../repository/chat-repository";
import { z } from "zod";

const GetHistoryParamsSchema = z.object({
  userId: z.string(),
});

const GetHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function getHistory(req: Request, res: Response) {
  const session = await auth.api.getSession({
    headers: toFetchHeaders(req.headers),
  });
  if (!session?.user) return res.status(401).json({ error: "Unauthorized" });

  const paramsResult = GetHistoryParamsSchema.safeParse(req.params);
  if (!paramsResult.success) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  const queryResult = GetHistoryQuerySchema.safeParse(req.query);
  if (!queryResult.success) {
    return res.status(400).json({ error: "Invalid query parameters" });
  }

  const history = await getChatHistory(
    session.user.id,
    paramsResult.data.userId,
    queryResult.data.limit,
  );
  return res.json({ success: true, data: history.reverse() });
}

export async function getRecentConversationsHandler(
  req: Request,
  res: Response,
) {
  const session = await auth.api.getSession({
    headers: toFetchHeaders(req.headers),
  });

  if (!session?.user) return res.status(401).json({ error: "Unauthorized" });

  const conversations = await getRecentConversations(session.user.id);

  return res.json({ success: true, data: conversations });
}
