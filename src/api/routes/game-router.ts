import { Router } from "express";
import {
  getUserMatchDetail,
  getUserMatches,
} from "../controller/game-controller";
const gameRouter = Router();

gameRouter.get("/history/:id", getUserMatches);
gameRouter.get("/:gameId", getUserMatchDetail);
export default gameRouter;
