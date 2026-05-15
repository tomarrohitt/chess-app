import { Router } from "express";
import {
  requestFriend,
  acceptRequest,
  declineRequest,
  cancelRequest,
  remove,
  block,
  unblock,
  listFriends,
  getCounts,
  listRequests,
  listBlocked,
  searchUsers,
} from "../controller/friend-controller";

const friendRouter = Router();

friendRouter.get("/", listFriends);
friendRouter.get("/counts", getCounts);
friendRouter.get("/requests", listRequests);
friendRouter.get("/blocked", listBlocked);
friendRouter.get("/search", searchUsers);
friendRouter.post("/request", requestFriend);
friendRouter.post("/accept", acceptRequest);
friendRouter.delete("/decline", declineRequest);
friendRouter.post("/cancel", cancelRequest);
friendRouter.delete("/remove", remove);
friendRouter.delete("/unblock", unblock);
friendRouter.post("/block", block);

export default friendRouter;
