import { or, and, eq, desc, gt, sql } from "drizzle-orm";
import { messages, user, clearedChats } from "../../infrastructure/db/schema";
import { db } from "../../infrastructure/db/db";

export async function saveMessage(
  senderId: string,
  receiverId: string,
  content: string,
  id: string,
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
  currentUserId: string,
  friendId: string,
  limit = 50,
) {
  const friendDataPromise = db
    .select({
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
    })
    .from(user)
    .where(eq(user.id, friendId))
    .limit(1)
    .then((res) => res[0]);

  const chatMessagesPromise = (async () => {
    const clearedRecord = await db
      .select()
      .from(clearedChats)
      .where(
        and(
          eq(clearedChats.userId, currentUserId),
          eq(clearedChats.otherUserId, friendId),
        ),
      )
      .limit(1);

    const watermark = clearedRecord[0]?.clearedAt || new Date(0);

    return db
      .select()
      .from(messages)
      .where(
        and(
          or(
            and(
              eq(messages.senderId, currentUserId),
              eq(messages.receiverId, friendId),
            ),
            and(
              eq(messages.senderId, friendId),
              eq(messages.receiverId, currentUserId),
            ),
          ),
          gt(messages.createdAt, watermark),
        ),
      )
      .orderBy(desc(messages.createdAt))
      .limit(limit);
  })();

  const [friendData, chatMessages] = await Promise.all([
    friendDataPromise,
    chatMessagesPromise,
  ]);

  return {
    user: friendData,
    messages: chatMessages,
  };
}

export async function getRecentConversations(userId: string) {
  const allMsgs = await db
    .select()
    .from(messages)
    .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
    .orderBy(desc(messages.createdAt));

  const userClearedRecords = await db
    .select()
    .from(clearedChats)
    .where(eq(clearedChats.userId, userId));

  const clearedMap = new Map<string, Date>();
  for (const record of userClearedRecords) {
    clearedMap.set(record.otherUserId, record.clearedAt);
  }

  const conversationsMap = new Map<string, any>();
  for (const msg of allMsgs) {
    const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
    const watermark = clearedMap.get(otherUserId) || new Date(0);

    if (new Date(msg.createdAt) > watermark) {
      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, msg);
      }
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

export async function clearChat(userId: string, otherUserId: string) {
  const now = new Date();
  await db
    .insert(clearedChats)
    .values({
      userId,
      otherUserId,
      clearedAt: now,
    })
    .onConflictDoUpdate({
      target: [clearedChats.userId, clearedChats.otherUserId],
      set: { clearedAt: now },
    });
}
