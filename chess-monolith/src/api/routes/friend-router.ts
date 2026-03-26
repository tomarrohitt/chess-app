import { Router } from "express";
import {
  requestFriend,
  acceptRequest,
  rejectRequest,
  remove,
  block,
  listFriends,
  listRequests,
} from "../controller/friend-controller";

const friendRouter = Router();

friendRouter.get("/", listFriends);
friendRouter.get("/requests", listRequests);
friendRouter.post("/request", requestFriend);
friendRouter.post("/accept", acceptRequest);
friendRouter.post("/reject", rejectRequest);
friendRouter.post("/remove", remove);
friendRouter.post("/block", block);

export default friendRouter;
