import { and, desc, eq, isNull, ne, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { friends, user } from "../../infrastructure/db/schema";
import { db } from "../../infrastructure/db/db";

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

export async function getBlockedUsers(userId: string) {
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
    .innerJoin(u, eq(f.friendId, u.id))
    .where(and(eq(f.userId, userId), eq(f.status, "BLOCKED")))
    .orderBy(desc(f.createdAt), u.id);
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
