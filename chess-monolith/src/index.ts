import "dotenv/config";
import cors from "cors";
import http from "http";
import express from "express";
import { toNodeHandler } from "better-auth/node";

import { auth } from "./lib/auth";
import { initializeWebSocketServer } from "./infrastructure/ws/web-socket-server";
import gameRouter from "./api/routes/game-router";
import friendRouter from "./api/routes/friend-router";
import chatRouter from "./api/routes/chat-router";
import userRouter from "./api/routes/user-router";
import { requestLogger } from "./lib/logger";

const app = express();

app.use(
  cors({
    origin: "*",
  }),
);

app.use(requestLogger);
app.use(express.json());

app.all("/api/auth/{*any}", toNodeHandler(auth));

app.use("/api/games", gameRouter);
app.use("/api/friends", friendRouter);
app.use("/api/chat", chatRouter);
app.use("/api/user", userRouter);

app.get("/health", (_, res) => {
  res.json({ status: "Chess engine is breathing" });
});

const server = http.createServer(app);

initializeWebSocketServer(server);

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
