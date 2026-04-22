import { Request, Response } from "express";
import {
  getChatHistory,
  getRecentConversations,
  clearChat,
  getAvailableFriends,
} from "../repository/chat-repository";
import { z } from "zod";

const GetHistoryParamsSchema = z.object({
  userId: z.uuid(),
});

const GetHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.uuid().optional(),
});

export async function getHistory(req: Request, res: Response) {
  const paramsResult = GetHistoryParamsSchema.safeParse(req.params);
  if (!paramsResult.success) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  const queryResult = GetHistoryQuerySchema.safeParse(req.query);
  if (!queryResult.success) {
    return res.status(400).json({ error: "Invalid query parameters" });
  }

  const { messages, user } = await getChatHistory(
    req.user.id,
    paramsResult.data.userId,
    queryResult.data.limit,
    queryResult.data.cursor,
  );

  const hasMore = messages.length === queryResult.data.limit;
  const nextCursor = hasMore ? messages[messages.length - 1].id : null;

  return res.json({
    success: true,
    data: { user, messages: messages.reverse(), nextCursor, hasMore },
  });
}

export async function getRecentConversationsHandler(
  req: Request,
  res: Response,
) {
  const conversations = await getRecentConversations(req.user.id);

  return res.json({ success: true, data: conversations });
}

export async function getAvailableFriendsHandler(req: Request, res: Response) {
  const results = await getAvailableFriends(req.user.id);
  return res.json({ success: true, data: results });
}

const ClearChatParamsSchema = z.object({
  userId: z.uuid(),
});

export async function clearChatHandler(req: Request, res: Response) {
  const paramsResult = ClearChatParamsSchema.safeParse(req.params);
  if (!paramsResult.success) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  await clearChat(req.user.id, paramsResult.data.userId);
  return res.json({ success: true });
}
