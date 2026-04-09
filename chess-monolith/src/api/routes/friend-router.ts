import { Router } from "express";
import {
  requestFriend,
  acceptRequest,
  declineRequest,
  remove,
  block,
  listFriends,
  listRequests,
  searchUsers,
} from "../controller/friend-controller";

const friendRouter = Router();

friendRouter.get("/", listFriends);
friendRouter.get("/requests", listRequests);
friendRouter.get("/search", searchUsers);
friendRouter.post("/request", requestFriend);
friendRouter.post("/accept", acceptRequest);
friendRouter.delete("/decline", declineRequest);
friendRouter.delete("/remove", remove);
friendRouter.post("/block", block);

export default friendRouter;
