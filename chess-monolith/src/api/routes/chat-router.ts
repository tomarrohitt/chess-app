import { Router } from "express";
import { getHistory } from "../controller/chat-controller";

const chatRouter = Router();

chatRouter.get("/history/:userId", getHistory);

export default chatRouter;
