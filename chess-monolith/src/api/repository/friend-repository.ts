import { and, eq, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { friends, user } from "../../infrastructure/db/schema";
import { db } from "../../infrastructure/db/db";

export async function sendFriendRequest(userId: string, friendId: string) {
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

export async function rejectFriendRequest(userId: string, friendId: string) {
  await db
    .update(friends)
    .set({ status: "REJECTED" })
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
    );
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
    .where(and(eq(f.friendId, userId), eq(f.status, "PENDING")));
}
