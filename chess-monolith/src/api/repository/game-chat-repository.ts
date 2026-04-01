import { db } from "../../infrastructure/db/db";
import { games } from "../../infrastructure/db/schema";
import { eq, sql } from "drizzle-orm";

// The message format from the stream
interface GameChatMessage {
  id: string;
  gameId: string;
  sender: {
    id: string;
    username: string;
    image: string | null;
    rating: number;
  };
  content: string;
  createdAt: string; // ISO string
}

export async function appendGameMessagesBatch(messages: GameChatMessage[]) {
  if (messages.length === 0) {
    return;
  }

  const messagesByGame = messages.reduce(
    (acc, msg) => {
      if (!acc[msg.gameId]) {
        acc[msg.gameId] = [];
      }
      acc[msg.gameId].push(msg);
      return acc;
    },
    {} as Record<string, GameChatMessage[]>,
  );

  await db.transaction(async (tx) => {
    for (const gameId in messagesByGame) {
      const gameMessages = messagesByGame[gameId];
      gameMessages.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

      const messagesJson = JSON.stringify(gameMessages);
      await tx
        .update(games)
        .set({ chatLogs: sql`${games.chatLogs} || ${messagesJson}::jsonb` })
        .where(eq(games.id, gameId));
    }
  });
}
