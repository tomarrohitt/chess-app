import { or, and, eq, desc } from "drizzle-orm";
import { messages, user } from "../../infrastructure/db/schema";
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

export async function getRecentConversations(userId: string) {
  const allMsgs = await db
    .select()
    .from(messages)
    .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
    .orderBy(desc(messages.createdAt));

  const conversationsMap = new Map<string, any>();
  for (const msg of allMsgs) {
    const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
    if (!conversationsMap.has(otherUserId)) {
      conversationsMap.set(otherUserId, msg);
    }
  }

  const recentConversations = [];
  for (const [otherUserId, lastMessage] of conversationsMap.entries()) {
    const [otherUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, otherUserId))
      .limit(1);

    if (otherUser) {
      recentConversations.push({
        user: {
          id: otherUser.id,
          name: otherUser.name,
          username: otherUser.username,
          image: otherUser.image,
        },
        lastMessage,
      });
    }
  }

  return recentConversations;
}
