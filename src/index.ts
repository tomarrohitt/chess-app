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
import { routeConfigs } from "./config/routes";
import { env } from "./config/env";
import { currentUser } from "./lib/utils/get-current-user";

const app = express();

app.use(
  cors({
    origin: "*",
  }),
);

app.use(requestLogger);
app.use(express.json());

app.use((req, res, next) => {
  const matchedRoute = routeConfigs.find(
    (config) =>
      req.path === config.path || req.path.startsWith(`${config.path}/`),
  );

  if (matchedRoute) {
    const rule = matchedRoute.rules.find(
      (r) => r.method === "ALL" || r.method === req.method,
    );

    if (!rule) {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    if (rule.protected) {
      if (!req.headers.cookie) {
        return res
          .status(401)
          .json({ error: "Unauthenticated: No cookie found" });
      }
      return currentUser(req, res, next);
    }
  } else if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Not Found" });
  }

  next();
});

app.all("/api/auth/{*any}", toNodeHandler(auth));

app.use("/api/games", gameRouter);
app.use("/api/friends", friendRouter);
app.use("/api/chat", chatRouter);
app.use("/api/user", userRouter);

app.all("/api/{*any}", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `The endpoint [${req.method}] ${req.originalUrl} does not exist.`,
  });
});

app.all("{*any}", (req, res) => {
  res.status(404).json({ error: "Endpoint not Found" });
});

const server = http.createServer(app);

initializeWebSocketServer(server);

const PORT = env.PORT;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
