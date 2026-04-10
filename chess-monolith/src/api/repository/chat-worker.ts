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
      msgsToInsert.push({
        id: parsed.id,
        senderId: parsed.sender?.id || parsed.senderId,
        receiverId: parsed.receiverId,
        content: parsed.content,
        createdAt: new Date(parsed.createdAt),
        read: parsed.read || false,
      });
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

const DLQ_FLUSH_INTERVAL_MS = 60000;

async function recoverDeadLetters() {
  try {
    const batchSize = 100;
    const rawMsgs = await redis.lrange("chat:dead_letters", 0, batchSize - 1);

    if (!rawMsgs || rawMsgs.length === 0) return;

    const msgsToInsert = rawMsgs.map((raw) => {
      const parsed = JSON.parse(raw);
      return {
        id: parsed.id,
        senderId: parsed.sender?.id || parsed.senderId,
        receiverId: parsed.receiverId,
        content: parsed.content,
        createdAt: new Date(parsed.createdAt),
        read: parsed.read || false,
      };
    });

    await saveMessagesBatch(msgsToInsert);

    await redis.ltrim("chat:dead_letters", rawMsgs.length, -1);
    console.log(
      `[Chat Worker] Successfully recovered ${rawMsgs.length} messages from DLQ.`,
    );
  } catch (err) {
    console.error(`[Chat Worker] Failed to recover messages from DLQ:`, err);
  }
}

setInterval(recoverDeadLetters, DLQ_FLUSH_INTERVAL_MS);
