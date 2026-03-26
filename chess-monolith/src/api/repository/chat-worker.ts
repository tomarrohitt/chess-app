import { redis } from "../../infrastructure/redis/redis-client";
import { saveMessagesBatch } from "../../api/repository/chat-repository";
import { v7 as uuidv7 } from "uuid";

const STREAM_KEY = "chat:stream";
const GROUP_NAME = "chat_workers";
const CONSUMER_NAME = "worker_" + uuidv7();
const FLUSH_INTERVAL_MS = 2000;

async function initStreamGroup() {
  try {
    await redis.xgroup("CREATE", STREAM_KEY, GROUP_NAME, "0", "MKSTREAM");
  } catch (err: any) {
    if (!err.message?.includes("BUSYGROUP")) {
      console.error("[Chat Worker] Failed to create consumer group", err);
    }
  }
}
initStreamGroup();

export async function queueChatMessage(msg: any) {
  await redis.xadd(
    STREAM_KEY,
    "MAXLEN",
    "~",
    10000,
    "*",
    "data",
    JSON.stringify(msg),
  );
}

async function flushChatBuffer() {
  try {
    const result = (await redis.xreadgroup(
      "GROUP",
      GROUP_NAME,
      CONSUMER_NAME,
      "COUNT",
      500,
      "STREAMS",
      STREAM_KEY,
      ">",
    )) as any;

    if (!result || result.length === 0) return;

    const streamMessages = result[0][1];
    if (!streamMessages || streamMessages.length === 0) return;

    const msgsToInsert = [];
    const msgIds = [];
    const rawMsgsForDLQ: string[] = [];

    for (const [id, fields] of streamMessages) {
      msgIds.push(id);
      const raw = fields[1];
      rawMsgsForDLQ.push(raw);

      const parsed = JSON.parse(raw);
      msgsToInsert.push({ ...parsed, createdAt: new Date(parsed.createdAt) });
    }

    try {
      await saveMessagesBatch(msgsToInsert);
      await redis.xack(STREAM_KEY, GROUP_NAME, ...msgIds);
    } catch (dbErr) {
      console.error(`[Chat Worker] DB insert failed:`, dbErr);

      if (rawMsgsForDLQ.length > 0) {
        await redis
          .rpush("chat:dead_letters", ...rawMsgsForDLQ)
          .catch((pushErr) => {
            console.error(
              `[Chat Worker] CRITICAL: Failed to save to DLQ:`,
              pushErr,
            );
          });
      }
      await redis.xack(STREAM_KEY, GROUP_NAME, ...msgIds);
    }
  } catch (err) {
    console.error(`[Chat Worker] Failed to process stream:`, err);
  }
}

setInterval(flushChatBuffer, FLUSH_INTERVAL_MS);
