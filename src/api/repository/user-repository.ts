import { eq } from "drizzle-orm";
import { user } from "../../infrastructure/db/schema";
import { db } from "../../infrastructure/db/db";

export async function getUserById(userId: string) {
  const users = await db
    .select({
      id: user.id,
      username: user.username,
      image: user.image,
      name: user.name,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return users[0] ?? null;
}

export async function getFullUser(userId: string) {
  const users = await db
    .select({
      id: user.id,
      username: user.username,
      image: user.image,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      wins: user.wins,
      losses: user.losses,
      draws: user.draws,
      rating: user.rating,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return users[0] ?? null;
}
