import { Request, Response } from "express";
import { redis } from "../../infrastructure/redis/redis-client";
import { db } from "../../infrastructure/db/db";
import { sql } from "drizzle-orm";

export async function healthCheck(req: Request, res: Response) {
  const health = {
    uptime: process.uptime(),
    message: "OK",
    timestamp: Date.now(),
    services: {
      redis: "down",
      database: "down",
    },
  };

  try {
    await redis.ping();
    health.services.redis = "up";
  } catch (error) {
    console.error("Redis health check failed:", error);
    health.message = "ERROR";
  }

  try {
    await db.execute(sql`SELECT 1`);
    health.services.database = "up";
  } catch (error) {
    console.error("Database health check failed:", error);
    health.message = "ERROR";
  }

  return res.status(health.message === "OK" ? 200 : 503).json(health);
}
