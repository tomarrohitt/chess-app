import { Request, Response, NextFunction } from "express";
import { toFetchHeaders } from "./to-fetch-headers";
import { auth } from "../auth";
import { redis } from "../../infrastructure/redis/redis-client";
import { extractToken } from "./auth-utils";
import { Keys } from "../keys";

export const currentUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res
        .status(401)
        .json({ error: "Unauthenticated: Session token missing" });
    }

    const cacheKey = Keys.session(token);
    const cachedSession = await redis.get(cacheKey);

    if (cachedSession) {
      const parsed = JSON.parse(cachedSession);
      req.user = parsed.user;
      return next();
    }

    const session = await auth.api.getSession({
      headers: toFetchHeaders(req.headers),
    });

    if (!session?.user) {
      return res
        .status(401)
        .json({ error: "Unauthenticated: Invalid session" });
    }

    req.user = session.user;
    const expiresAt = new Date(session.session.expiresAt).getTime();
    const now = Date.now();
    const remainingTTL = Math.floor((expiresAt - now) / 1000);

    if (remainingTTL > 0) {
      await redis.set(cacheKey, JSON.stringify(session), "EX", remainingTTL);
    }
    return next();
  } catch (err) {
    console.error("Error resolving user context:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
