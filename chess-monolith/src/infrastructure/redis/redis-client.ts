import { Redis } from "ioredis";
import "dotenv/config";

export const redis = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
  },
);

redis.on("error", (err) => {
  console.error("Redis error:", err);
});
