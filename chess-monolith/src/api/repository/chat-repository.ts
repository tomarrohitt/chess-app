import { or, and, eq, desc } from "drizzle-orm";
import { messages } from "../../infrastructure/db/schema";
import { db } from "../../infrastructure/db/db";

export async function saveMessage(
  senderId: string,
  receiverId: string,
  content: string,
  id?: string,
  createdAt?: Date,
) {
  const [msg] = await db
    .insert(messages)
    .values({
      id,
      senderId,
      receiverId,
      content,
      createdAt,
    })
    .returning();
  return msg;
}

export async function saveMessagesBatch(
  msgs: {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    createdAt: Date;
    read: boolean;
  }[],
) {
  if (msgs.length === 0) return;
  await db.insert(messages).values(msgs);
}

export async function getChatHistory(
  user1Id: string,
  user2Id: string,
  limit = 50,
) {
  return await db
    .select()
    .from(messages)
    .where(
      or(
        and(eq(messages.senderId, user1Id), eq(messages.receiverId, user2Id)),
        and(eq(messages.senderId, user2Id), eq(messages.receiverId, user1Id)),
      ),
    )
    .orderBy(desc(messages.createdAt))
    .limit(limit);
}
