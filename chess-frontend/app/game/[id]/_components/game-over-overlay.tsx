"use client";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/use-game-store";
import { GameOverState, GameStatus } from "@/types/chess";

function getResult(gameOver: GameOverState, userId: string) {
  if (gameOver.status === GameStatus.DRAW)
    return { emoji: "🤝", headline: "Draw", color: "text-yellow-400" };
  const won = gameOver.winnerId === userId;
  return {
    emoji: won ? "🏆" : "💀",
    headline: won ? "You Won!" : "You Lost",
    color: won ? "text-green-400" : "text-red-400",
  };
}

export function GameOverOverlay({ gameOver, userId }: { gameOver: GameOverState; userId: string }) {
  const router = useRouter();
  const resetGame = useGameStore((s) => s.resetGame);
  const { emoji, headline, color } = getResult(gameOver, userId);

  return (
    <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] flex items-center justify-center rounded-sm z-10">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl px-10 py-8 flex flex-col items-center gap-3 shadow-2xl text-center">
        <span className="text-5xl">{emoji}</span>
        <h2 className={`text-3xl font-bold ${color}`}>{headline}</h2>
        {gameOver.reason && (
          <p className="text-zinc-500 text-sm capitalize">{gameOver.reason}</p>
        )}
        <button
          onClick={() => { resetGame(); router.push("/game"); }}
          className="mt-3 px-7 py-2.5 bg-green-700 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors text-sm"
        >
          New Game
        </button>
      </div>
    </div>
  );
}