import { Router } from "express";
import {
  getHistory,
  getRecentConversationsHandler,
  clearChatHandler,
} from "../controller/chat-controller";

const chatRouter = Router();

chatRouter.get("/history/:userId", getHistory);
chatRouter.delete("/history/:userId", clearChatHandler);
chatRouter.get("/conversations", getRecentConversationsHandler);

export default chatRouter;
