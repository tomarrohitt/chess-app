import { and, count, desc, eq, isNull, ne, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { friends, user } from "../../infrastructure/db/schema";
import { db } from "../../infrastructure/db/db";
import { redis } from "../../infrastructure/redis/redis-client";
import { ChatUserInfo } from "../../types/types";
import { Keys } from "../../lib/keys";

export async function sendFriendRequest(userId: string, friendId: string) {
  const existingReverse = await db.query.friends.findFirst({
    where: and(eq(friends.userId, friendId), eq(friends.friendId, userId)),
  });

  if (existingReverse) {
    if (existingReverse.status === "PENDING") {
      await acceptFriendRequest(userId, friendId);
      return;
    }

    if (
      existingReverse.status === "ACCEPTED" ||
      existingReverse.status === "BLOCKED"
    ) {
      return;
    }
  }

  await db
    .insert(friends)
    .values({
      userId,
      friendId,
      status: "PENDING",
    })
    .onConflictDoUpdate({
      target: [friends.userId, friends.friendId],
      set: { status: "PENDING" },
    });
}

export async function acceptFriendRequest(userId: string, friendId: string) {
  await db
    .update(friends)
    .set({ status: "ACCEPTED" })
    .where(and(eq(friends.userId, friendId), eq(friends.friendId, userId)));
}

export async function declineFriendRequest(userId: string, friendId: string) {
  await db
    .delete(friends)
    .where(and(eq(friends.userId, friendId), eq(friends.friendId, userId)));
}

export async function removeFriend(userId: string, friendId: string) {
  await db
    .delete(friends)
    .where(
      or(
        and(eq(friends.userId, userId), eq(friends.friendId, friendId)),
        and(eq(friends.userId, friendId), eq(friends.friendId, userId)),
      ),
    );
}

export async function blockUser(userId: string, friendId: string) {
  await db
    .insert(friends)
    .values({
      userId,
      friendId,
      status: "BLOCKED",
    })
    .onConflictDoUpdate({
      target: [friends.userId, friends.friendId],
      set: { status: "BLOCKED" },
    });

  await db
    .delete(friends)
    .where(and(eq(friends.userId, friendId), eq(friends.friendId, userId)));

  const cacheKey = Keys.getBlockedUsersCacheKey(userId);
  const idsCacheKey = Keys.getBlockedIdsCacheKey(userId);

  const [blockedUserDetails, cachedBlockedUsers] = await Promise.all([
    db.query.user.findFirst({
      where: eq(user.id, friendId),
      columns: {
        id: true,
        name: true,
        username: true,
        image: true,
        rating: true,
      },
    }),
    redis.get(cacheKey),
  ]);

  if (!blockedUserDetails) return;
  let blockedUsers: ChatUserInfo[] = cachedBlockedUsers
    ? JSON.parse(cachedBlockedUsers)
    : [];

  if (!blockedUsers.some((u) => u.id === friendId)) {
    blockedUsers.push(blockedUserDetails);
    await redis.set(cacheKey, JSON.stringify(blockedUsers));
  }

  await redis.sadd(idsCacheKey, friendId);
}

export async function unblockUser(userId: string, friendId: string) {
  await db
    .delete(friends)
    .where(
      and(
        eq(friends.userId, userId),
        eq(friends.friendId, friendId),
        eq(friends.status, "BLOCKED"),
      ),
    );

  const cacheKey = Keys.getBlockedUsersCacheKey(userId);
  const idsCacheKey = Keys.getBlockedIdsCacheKey(userId);

  const cachedBlockedUsers = await redis.get(cacheKey);

  if (cachedBlockedUsers) {
    let blockedUsers: ChatUserInfo[] = JSON.parse(cachedBlockedUsers);
    blockedUsers = blockedUsers.filter((u) => u.id !== friendId);
    await redis.set(cacheKey, JSON.stringify(blockedUsers));
  }

  await redis.srem(idsCacheKey, friendId);
}

export async function getFriendship(userId: string, friendId: string) {
  return await db
    .select()
    .from(friends)
    .where(
      or(
        and(eq(friends.userId, userId), eq(friends.friendId, friendId)),
        and(eq(friends.userId, friendId), eq(friends.friendId, userId)),
      ),
    );
}

export async function getFriends(userId: string) {
  const f = alias(friends, "f");
  const u = alias(user, "u");

  return await db
    .select({
      id: u.id,
      name: u.name,
      username: u.username,
      rating: u.rating,
      wins: u.wins,
      losses: u.losses,
      draws: u.draws,
      image: u.image,
      createdAt: u.createdAt,
    })
    .from(f)
    .innerJoin(
      u,
      or(
        and(eq(f.userId, userId), eq(f.friendId, u.id)),
        and(eq(f.friendId, userId), eq(f.userId, u.id)),
      ),
    )
    .where(
      and(
        or(eq(f.userId, userId), eq(f.friendId, userId)),
        eq(f.status, "ACCEPTED"),
      ),
    )
    .orderBy(desc(f.createdAt), u.id);
}

export async function getFriendshipCounts(userId: string) {
  const [friendsCountRes, requestsCountRes, blockedCountRes] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(friends)
        .where(
          and(
            or(eq(friends.userId, userId), eq(friends.friendId, userId)),
            eq(friends.status, "ACCEPTED"),
          ),
        ),
      db
        .select({ value: count() })
        .from(friends)
        .where(
          and(eq(friends.friendId, userId), eq(friends.status, "PENDING")),
        ),
      db
        .select({ value: count() })
        .from(friends)
        .where(and(eq(friends.userId, userId), eq(friends.status, "BLOCKED"))),
    ]);

  return {
    friends: friendsCountRes[0]?.value ?? 0,
    requests: requestsCountRes[0]?.value ?? 0,
    blocked: blockedCountRes[0]?.value ?? 0,
  };
}

export async function getFriendRequests(userId: string) {
  const f = alias(friends, "f");
  const u = alias(user, "u");
  return await db
    .select({
      id: u.id,
      name: u.name,
      username: u.username,
      rating: u.rating,
      wins: u.wins,
      losses: u.losses,
      draws: u.draws,
      image: u.image,
      createdAt: u.createdAt,
    })
    .from(f)
    .innerJoin(u, eq(f.userId, u.id))
    .where(and(eq(f.friendId, userId), eq(f.status, "PENDING")))
    .orderBy(desc(f.createdAt), u.id);
}

export async function getBlockedUsers(userId: string): Promise<ChatUserInfo[]> {
  const cacheKey = Keys.getBlockedUsersCacheKey(userId);
  const idsCacheKey = Keys.getBlockedIdsCacheKey(userId); // The new Set key

  const cachedBlockedUsers = await redis.get(cacheKey);

  if (cachedBlockedUsers) {
    return JSON.parse(cachedBlockedUsers);
  }

  const f = alias(friends, "f");
  const u = alias(user, "u");

  const dbBlockedUsers = await db
    .select({
      id: u.id,
      name: u.name,
      username: u.username,
      image: u.image,
      rating: u.rating,
    })
    .from(f)
    .innerJoin(u, eq(f.friendId, u.id))
    .where(and(eq(f.userId, userId), eq(f.status, "BLOCKED")))
    .orderBy(desc(f.createdAt), u.id);

  await redis.set(cacheKey, JSON.stringify(dbBlockedUsers));

  if (dbBlockedUsers.length > 0) {
    const blockedIds = dbBlockedUsers.map((user) => user.id);
    await redis.sadd(idsCacheKey, ...blockedIds);
  }

  return dbBlockedUsers;
}

export async function searchGlobalUsers(
  searchTerm: string,
  currentUserId: string,
  page: number = 1,
  limitSize: number = 20,
) {
  const query = sql.param(searchTerm);
  const offset = (page - 1) * limitSize;

  const similarityScore = sql<number>`word_similarity(${query}, (${user.username} || ' ' || ${user.name}))`;

  return await db
    .select({
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
      rating: user.rating,
      friendStatus: friends.status,
      friendSenderId: friends.userId,
    })
    .from(user)
    .leftJoin(
      friends,
      or(
        and(eq(friends.userId, currentUserId), eq(friends.friendId, user.id)),
        and(eq(friends.friendId, currentUserId), eq(friends.userId, user.id)),
      ),
    )
    .where(
      and(
        sql`(
          (${user.username} || ' ' || ${user.name}) ILIKE '%' || ${query} || '%' 
          OR 
          word_similarity(${query}, (${user.username} || ' ' || ${user.name})) >= 0.5
        )`,
        sql`${user.id} != ${currentUserId}`,
        or(isNull(friends.status), ne(friends.status, "BLOCKED")),
      ),
    )
    .orderBy(desc(similarityScore), user.id)
    .limit(limitSize)
    .offset(offset);
}
