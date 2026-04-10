import { Router } from "express";
import {
  getHistory,
  getRecentConversationsHandler,
} from "../controller/chat-controller";

const chatRouter = Router();

chatRouter.get("/history/:userId", getHistory);
chatRouter.get("/conversations", getRecentConversationsHandler);

export default chatRouter;
