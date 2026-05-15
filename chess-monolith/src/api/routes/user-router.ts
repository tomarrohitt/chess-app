import { Router } from "express";
import {
  getFullUserById,
  getUserByIdHandler,
} from "../controller/user-controller";
import { upload } from "../../config/multer";
import { uploadAvatar } from "../controller/upload-controller";

const userRouter = Router();

userRouter.get("/:id", getUserByIdHandler);
userRouter.get("/profile/:id", getFullUserById);
userRouter.post("/avatar", upload.single("avatar"), uploadAvatar);

export default userRouter;
