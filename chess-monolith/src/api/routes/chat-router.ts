import { Router } from "express";
import {
  getHistory,
  getRecentConversationsHandler,
  clearChatHandler,
  getAvailableFriendsHandler,
} from "../controller/chat-controller";

const chatRouter = Router();

chatRouter.get("/history/:userId", getHistory);
chatRouter.delete("/history/:userId", clearChatHandler);
chatRouter.get("/conversations", getRecentConversationsHandler);
chatRouter.get("/available-friends", getAvailableFriendsHandler);

export default chatRouter;
