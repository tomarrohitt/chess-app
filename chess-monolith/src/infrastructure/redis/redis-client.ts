import "dotenv/config";
import { Redis } from "ioredis";
import { env } from "../../config/env";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});
