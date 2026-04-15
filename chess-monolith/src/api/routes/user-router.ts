import { Router } from "express";
import { getUserByIdHandler } from "../controller/user-controller";

const userRouter = Router();

userRouter.get("/:id", getUserByIdHandler);

export default userRouter;
