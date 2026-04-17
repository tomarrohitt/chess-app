import { or, and, eq, desc, gt } from "drizzle-orm";
import {
  messages,
  user,
  friends,
  chatState,
} from "../../infrastructure/db/schema";
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
    const stateRecord = await db
      .select()
      .from(chatState)
      .where(
        and(
          eq(chatState.userId, currentUserId),
          eq(chatState.otherUserId, friendId),
        ),
      )
      .limit(1);

    const watermark = stateRecord[0]?.clearedAt || new Date(0);

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

  const blockCheckPromise = db
    .select()
    .from(friends)
    .where(
      or(
        and(eq(friends.userId, currentUserId), eq(friends.friendId, friendId)),
        and(eq(friends.friendId, currentUserId), eq(friends.userId, friendId)),
      ),
    )
    .limit(1)
    .then((res) => res[0]);

  const [friendData, chatMessages, friendRecord] = await Promise.all([
    friendDataPromise,
    chatMessagesPromise,
    blockCheckPromise,
  ]);

  return {
    user: {
      ...friendData,
      isBlocked: friendRecord?.status === "BLOCKED",
    },
    messages: chatMessages,
  };
}

export async function getRecentConversations(userId: string) {
  const allMsgs = await db
    .select()
    .from(messages)
    .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
    .orderBy(desc(messages.createdAt));

  const userStateRecords = await db
    .select()
    .from(chatState)
    .where(eq(chatState.userId, userId));

  const clearedMap = new Map<string, Date>();
  const watermarkMap = new Map<string, Date>();
  for (const record of userStateRecords) {
    clearedMap.set(record.otherUserId, record.clearedAt);
    watermarkMap.set(record.otherUserId, record.lastReadAt);
  }

  const conversationsMap = new Map<string, any>();
  const unreadCountsMap = new Map<string, number>();

  for (const msg of allMsgs) {
    const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
    const watermark = clearedMap.get(otherUserId) || new Date(0);

    if (new Date(msg.createdAt).getTime() > new Date(watermark).getTime()) {
      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, msg);
      }

      if (msg.receiverId === userId) {
        const readWatermark = watermarkMap.get(otherUserId) || new Date(0);
        if (
          new Date(msg.createdAt).getTime() > new Date(readWatermark).getTime()
        ) {
          unreadCountsMap.set(
            otherUserId,
            (unreadCountsMap.get(otherUserId) || 0) + 1,
          );
        }
      }
    }
  }

  const recentConversations = [];
  for (const [otherUserId, lastMessage] of conversationsMap.entries()) {
    const [otherUser, friendRecord] = await Promise.all([
      db
        .select()
        .from(user)
        .where(eq(user.id, otherUserId))
        .limit(1)
        .then((res) => res[0]),
      db
        .select()
        .from(friends)
        .where(
          or(
            and(eq(friends.userId, userId), eq(friends.friendId, otherUserId)),
            and(eq(friends.friendId, userId), eq(friends.userId, otherUserId)),
          ),
        )
        .limit(1)
        .then((res) => res[0]),
    ]);

    if (otherUser) {
      recentConversations.push({
        user: {
          id: otherUser.id,
          name: otherUser.name,
          username: otherUser.username,
          image: otherUser.image,
          isBlocked: friendRecord?.status === "BLOCKED",
        },
        lastMessage,
        unreadCount: unreadCountsMap.get(otherUserId) || 0,
      });
    }
  }

  return recentConversations;
}

export async function markChatAsRead(userId: string, otherUserId: string) {
  const now = new Date();
  await db
    .insert(chatState)
    .values({
      userId,
      otherUserId,
      lastReadAt: now,
    })
    .onConflictDoUpdate({
      target: [chatState.userId, chatState.otherUserId],
      set: { lastReadAt: now },
    });
}

export async function markAllChatsAsRead(userId: string) {
  const now = new Date();

  const senders = await db
    .selectDistinct({ senderId: messages.senderId })
    .from(messages)
    .where(eq(messages.receiverId, userId));

  if (senders.length === 0) return [];

  const valuesToUpsert = senders.map((s) => ({
    userId,
    otherUserId: s.senderId,
    lastReadAt: now,
  }));

  await db
    .insert(chatState)
    .values(valuesToUpsert)
    .onConflictDoUpdate({
      target: [chatState.userId, chatState.otherUserId],
      set: { lastReadAt: now },
    });

  return senders.map((s) => s.senderId);
}

export async function clearChat(userId: string, otherUserId: string) {
  const now = new Date();
  await db
    .insert(chatState)
    .values({
      userId,
      otherUserId,
      clearedAt: now,
    })
    .onConflictDoUpdate({
      target: [chatState.userId, chatState.otherUserId],
      set: { clearedAt: now },
    });
}
