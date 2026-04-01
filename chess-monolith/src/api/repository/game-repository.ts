import { eq, or, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { games, user } from "../../infrastructure/db/schema";
import { db } from "../../infrastructure/db/db";

export async function getUserMatchHistory(userId: string, limit = 20) {
  const whitePlayer = alias(user, "whitePlayer");
  const blackPlayer = alias(user, "blackPlayer");

  const results = await db
    .select({
      id: games.id,
      status: games.status,
      timeControl: games.timeControl,
      createdAt: games.createdAt,
      winnerId: games.winnerId,
      finalFen: games.finalFen,
      result: games.result,
      pgn: games.pgn,
      moveTimes: games.moveTimes,
      white: {
        id: whitePlayer.id,
        username: whitePlayer.username,
        currentRating: whitePlayer.rating,
        matchRating: games.whiteRating,
        diff: games.whiteDiff,
      },
      black: {
        id: blackPlayer.id,
        username: blackPlayer.username,
        currentRating: blackPlayer.rating,
        matchRating: games.blackRating,
        diff: games.blackDiff,
      },
    })
    .from(games)
    .leftJoin(whitePlayer, eq(games.whiteId, whitePlayer.id))
    .leftJoin(blackPlayer, eq(games.blackId, blackPlayer.id))
    .where(or(eq(games.whiteId, userId), eq(games.blackId, userId)))
    .orderBy(desc(games.createdAt))
    .limit(limit);

  return results;
}
export async function getGameDetails(gameId: string) {
  const whitePlayer = alias(user, "whitePlayer");
  const blackPlayer = alias(user, "blackPlayer");

  const game = await db
    .select({
      id: games.id,
      status: games.status,
      result: games.result,
      winnerId: games.winnerId,
      timeControl: games.timeControl,
      createdAt: games.createdAt,

      pgn: games.pgn,
      finalFen: games.finalFen,
      moveTimes: games.moveTimes,
      chatLogs: games.chatLogs,

      white: {
        id: games.whiteId,
        username: whitePlayer.username,
        image: whitePlayer.image,
        currentRating: whitePlayer.rating,
        rating: games.whiteRating,
        timeLeftMs: games.whiteTimeLeftMs,
        capturedPieces: games.capturedByWhite,
        diff: games.whiteDiff,
      },
      black: {
        id: games.blackId,
        username: blackPlayer.username,
        image: blackPlayer.image,
        currentRating: blackPlayer.rating,
        rating: games.blackRating,
        timeLeftMs: games.blackTimeLeftMs,
        capturedPieces: games.capturedByBlack,
        diff: games.blackDiff,
      },
    })
    .from(games)
    .leftJoin(whitePlayer, eq(games.whiteId, whitePlayer.id))
    .leftJoin(blackPlayer, eq(games.blackId, blackPlayer.id))
    .where(eq(games.id, gameId))
    .limit(1);

  return game[0] ?? null;
}
