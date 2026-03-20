import { db } from "../../infrastructure/db/db";
import { games, user } from "../../infrastructure/db/schema";
import { redis } from "../../infrastructure/redis/redis-client";
import { GameResult, GameStatus, GameUserSchema } from "../../types/types";
import { Keys } from "../../lib/keys";
import { eq, InferInsertModel, sql } from "drizzle-orm";
import { calculateNewRatings } from "../../lib/elo";
import { Chess } from "chess.js";
import { getCapturedPieces } from "./engine-utils";

export async function flushGameToDatabase(
  gameId: string,
  status: GameStatus,
  winnerId?: string,
): Promise<void> {
  const gameKey = Keys.game(gameId);
  const gameState = await redis.hgetall(gameKey);

  if (!gameState.whiteUser || !gameState.blackUser || !gameState.fen) {
    console.error(
      `[Storage] Missing critical data for game ${gameId} — skipping DB flush`,
    );
    return;
  }

  const whiteUserObj = GameUserSchema.parse(JSON.parse(gameState.whiteUser));
  const blackUserObj = GameUserSchema.parse(JSON.parse(gameState.blackUser));

  const [whiteUser, blackUser] = await Promise.all([
    db.query.user.findFirst({
      where: eq(user.id, whiteUserObj.id),
    }),
    db.query.user.findFirst({
      where: eq(user.id, blackUserObj.id),
    }),
  ]);

  if (!whiteUser || !blackUser) {
    console.error("[Storage] Could not find users in DB for rating update");
    return;
  }

  const scoreA =
    winnerId === whiteUser.id ? 1 : winnerId === blackUser.id ? 0 : 0.5;

  const isAbandoned = status === GameStatus.ABANDONED;
  let diffA = 0,
    diffB = 0;
  let newRatingA = whiteUser.rating,
    newRatingB = blackUser.rating;

  if (!isAbandoned) {
    const elo = calculateNewRatings(whiteUser.rating, blackUser.rating, scoreA);
    diffA = elo.diffA;
    diffB = elo.diffB;
    newRatingA = elo.newRatingA;
    newRatingB = elo.newRatingB;
  }

  const resultSymbol = isAbandoned
    ? "*"
    : winnerId === whiteUser.id
      ? "1-0"
      : winnerId === blackUser.id
        ? "0-1"
        : "1/2-1/2";

  const chess = new Chess();
  if (gameState.pgn) {
    try {
      chess.loadPgn(gameState.pgn);
    } catch (err) {
      console.error(`[Storage] Failed to load PGN for game ${gameId}`, err);
    }
  }
  chess.setHeader("White", whiteUser.username);
  chess.setHeader("Black", blackUser.username);
  chess.setHeader("Result", resultSymbol);
  chess.setHeader(
    "Date",
    new Date().toISOString().replace(/-/g, ".").split("T")[0],
  );
  chess.setHeader("WhiteElo", String(whiteUser.rating));
  chess.setHeader("BlackElo", String(blackUser.rating));
  chess.setHeader("TimeControl", gameState.timeControl);
  chess.setHeader("Termination", status);

  const finalPgn = chess.pgn();
  const capturedPieces = getCapturedPieces(gameState.fen!);

  const newGame: InferInsertModel<typeof games> = {
    id: gameId,
    whiteId: whiteUserObj.id,
    blackId: blackUserObj.id,
    winnerId: winnerId ?? null,
    status,
    result: winnerId
      ? winnerId === whiteUser.id
        ? GameResult.w
        : GameResult.b
      : GameResult.d,
    timeControl: gameState.timeControl,
    pgn: finalPgn,
    finalFen: gameState.fen!,
    whiteTimeLeftMs: whiteUserObj.timeLeftMs ?? 0,
    blackTimeLeftMs: blackUserObj.timeLeftMs ?? 0,
    moveTimes: JSON.parse(gameState.moveTimes ?? "[]"),
    capturedByBlack: capturedPieces.capturedByBlack,
    capturedByWhite: capturedPieces.capturedByWhite,

    whiteRating: whiteUser.rating,
    blackRating: blackUser.rating,

    whiteDiff: diffA,
    blackDiff: diffB,
  };
  try {
    await db.transaction(async (tx) => {
      await tx.insert(games).values(newGame);

      await tx
        .update(user)
        .set({
          rating: newRatingA,
          wins: winnerId === whiteUser.id ? sql`${user.wins} + 1` : user.wins,
          losses:
            winnerId === blackUser.id ? sql`${user.losses} + 1` : user.losses,
          draws:
            !winnerId && !isAbandoned ? sql`${user.draws} + 1` : user.draws,
        })
        .where(eq(user.id, whiteUser.id));

      await tx
        .update(user)
        .set({
          rating: newRatingB,
          wins: winnerId === blackUser.id ? sql`${user.wins} + 1` : user.wins,
          losses:
            winnerId === whiteUser.id ? sql`${user.losses} + 1` : user.losses,
          draws:
            !winnerId && !isAbandoned ? sql`${user.draws} + 1` : user.draws,
        })
        .where(eq(user.id, blackUser.id));
    });

    await Promise.all([
      redis.del(gameKey),
      redis.del(Keys.userActiveGame(whiteUser.id)),
      redis.del(Keys.userActiveGame(blackUser.id)),
    ]);
  } catch (error) {
    console.error(`[Storage] Failed to flush game ${gameId} to DB:`, error);
  }
}
