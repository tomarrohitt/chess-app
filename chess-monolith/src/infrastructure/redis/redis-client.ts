import { Redis } from "ioredis";
import "dotenv/config";
import { env } from "../../config/env";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});
