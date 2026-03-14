"use client";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/use-game-store";
import { useSocket } from "@/store/socket-provider";
import { GameOverState, GameStatus } from "@/types/chess";

function getResult(gameOver: GameOverState, userId: string) {
  if (gameOver.status === GameStatus.ABANDONED) {
    return {
      emoji: "🛑",
      headline: "Aborted",
      color: "text-zinc-200",
      bg: "bg-zinc-900/90",
      border: "border-zinc-700",
      button: "bg-zinc-700 hover:bg-zinc-600 text-white",
    };
  }
  if (!gameOver.winnerId) {
    return {
      emoji: "🤝",
      headline: "Draw",
      color: "text-zinc-200",
      bg: "bg-zinc-900/90",
      border: "border-zinc-700",
      button: "bg-zinc-700 hover:bg-zinc-600 text-white",
    };
  }
  const won = gameOver.winnerId === userId;
  return {
    emoji: won ? "🏆" : "💀",
    headline: won ? "Victory" : "Defeat",
    color: won ? "text-emerald-400" : "text-rose-400",
    bg: won ? "bg-emerald-950/80" : "bg-rose-950/80",
    border: won ? "border-emerald-900/60" : "border-rose-900/60",
    button: won
      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20"
      : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/20",
  };
}

export function GameOverOverlay({
  gameOver,
  userId,
}: {
  gameOver: GameOverState;
  userId: string;
}) {
  const router = useRouter();
  const { resetGame, activeGame, rematchOffer, rematchOfferSent } =
    useGameStore((s) => s);
  const { joinQueue, offerRematch, acceptRematch, declineRematch } =
    useSocket();
  const { emoji, headline, color, bg, border, button } = getResult(
    gameOver,
    userId,
  );

  const winnerColor = gameOver.winnerId
    ? gameOver.winnerId === activeGame?.whiteId
      ? "White"
      : "Black"
    : null;

  let subtitle = "Game drawn";
  if (gameOver.status === GameStatus.ABANDONED) {
    subtitle = "Game aborted";
  } else if (winnerColor) {
    subtitle = `${winnerColor} won`;
  }

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-sm z-50">
      <div
        className={`border ${border} ${bg} rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl text-center w-[90%] max-w-85 transform transition-all scale-100`}
      >
        <div className="text-6xl drop-shadow-lg mb-2">{emoji}</div>

        <div className="space-y-1">
          <h2
            className={`text-4xl font-black tracking-tight uppercase ${color}`}
          >
            {headline}
          </h2>
          <div className="text-zinc-300 font-medium">
            {subtitle}
            {gameOver.reason && gameOver.reason.toLowerCase() !== "aborted" && (
              <span className="text-zinc-400 font-normal">
                {gameOver.status === GameStatus.ABANDONED
                  ? `: ${gameOver.reason}`
                  : ` by ${gameOver.reason.toLowerCase()}`}
              </span>
            )}
          </div>
        </div>

        <div className="w-full h-px bg-white/10 my-2" />

        <div className="flex w-full gap-2 mt-2">
          <button
            onClick={() => {
              const timeControl = activeGame?.timeControl;
              resetGame();
              if (timeControl) {
                joinQueue(timeControl);
              }
            }}
            className={`flex-1 py-3 font-bold rounded-xl transition-all duration-200 shadow-lg ${button}`}
          >
            New Game
          </button>
          {!rematchOffer && !rematchOfferSent && (
            <button
              onClick={() => {
                if (activeGame) {
                  const opponentId =
                    activeGame.whiteId === userId
                      ? activeGame.blackId
                      : activeGame.whiteId;
                  offerRematch(
                    activeGame.gameId,
                    opponentId,
                    activeGame.timeControl,
                  );
                }
              }}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all"
            >
              Rematch
            </button>
          )}
          {rematchOfferSent === "sent" && (
            <button
              disabled
              className="flex-1 py-3 bg-zinc-600 text-zinc-300 font-bold rounded-xl shadow-lg cursor-not-allowed"
            >
              Sent...
            </button>
          )}
          {rematchOfferSent === "declined" && (
            <button
              disabled
              className="flex-1 py-3 bg-rose-950 text-rose-400 font-bold rounded-xl shadow-lg cursor-not-allowed"
            >
              Declined
            </button>
          )}
        </div>

        {!!rematchOffer && (
          <div className="w-full mt-2 p-3 bg-zinc-800 rounded-xl flex flex-col gap-2 shadow-lg">
            <span className="text-zinc-200 text-sm font-bold">
              Opponent wants a rematch!
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (activeGame) {
                    const opponentId =
                      activeGame.whiteId === userId
                        ? activeGame.blackId
                        : activeGame.whiteId;
                    acceptRematch(
                      activeGame.gameId,
                      opponentId,
                      activeGame.timeControl,
                    );
                  }
                }}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-bold"
              >
                Accept
              </button>
              <button
                onClick={() => {
                  if (activeGame) {
                    const opponentId =
                      activeGame.whiteId === userId
                        ? activeGame.blackId
                        : activeGame.whiteId;
                    declineRematch(
                      activeGame.gameId,
                      opponentId,
                      activeGame.timeControl,
                    );
                  }
                }}
                className="flex-1 bg-zinc-600 hover:bg-zinc-500 text-white py-2 rounded-lg font-bold"
              >
                Decline
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
