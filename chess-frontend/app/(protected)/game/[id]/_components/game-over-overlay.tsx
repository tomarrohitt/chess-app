"use client";
import { useState } from "react";
import { useGameStore } from "@/store/use-game-store";
import { useSocket } from "@/store/socket-provider";
import { DRAW_OFFER, GameOverState, GameStatus } from "@/types/chess";

export function GameOverOverlay({
  gameOver,
  userId,
}: {
  gameOver: GameOverState;
  userId: string;
}) {
  const { resetGame, activeGame, rematchOffer, rematchOfferSent } =
    useGameStore((s) => s);
  const { joinQueue, offerRematch } = useSocket();
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const won = gameOver.winnerId === userId;
  const isDraw =
    !gameOver.winnerId ||
    gameOver.status === GameStatus.AGREEMENT ||
    gameOver.status === GameStatus.STALEMATE;
  const isAbandoned = gameOver.status === GameStatus.ABANDONED;
  const isPlayer =
    userId === activeGame?.white.id || userId === activeGame?.black.id;

  const winnerColor = gameOver.winnerId
    ? gameOver.winnerId === activeGame?.white.id
      ? "White"
      : "Black"
    : null;

  let headline = "Draw";
  let headlineColor = "text-zinc-400";
  if (isAbandoned && !gameOver.winnerId) {
    headline = "Aborted";
    headlineColor = "text-zinc-500";
  } else if (winnerColor) {
    headline = won ? "You won" : "You lost";
    headlineColor = won ? "text-emerald-400" : "text-rose-400";
  }

  let subtitle = isAbandoned
    ? "Game aborted"
    : isDraw
      ? "Game drawn"
      : `${winnerColor} won`;

  if (gameOver.reason && !isAbandoned) {
    subtitle += ` by ${gameOver.reason.toLowerCase()}`;
  } else if (isAbandoned && winnerColor) {
    subtitle = `${winnerColor} won (abandoned)`;
  }

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-sm z-50">
      <div className="relative bg-zinc-950 border border-zinc-800/60 rounded-xl p-6 flex flex-col items-center gap-4 w-[85%] max-w-72 text-center">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-3 right-3 text-zinc-700 hover:text-zinc-400 transition-colors"
          aria-label="Close"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <div>
          <h2
            className={`font-serif text-3xl font-light tracking-tight ${headlineColor}`}
          >
            {headline}
          </h2>
          <p className="font-mono text-[11px] text-zinc-600 mt-1 tracking-wide">
            {subtitle}
          </p>
        </div>

        <div className="w-full h-px bg-zinc-800/60" />

        {isPlayer && (
          <div className="flex w-full gap-2">
            <button
              onClick={() => {
                const tc = activeGame?.timeControl;
                resetGame();
                if (tc) joinQueue(tc);
              }}
              className="flex-1 py-2.5 font-mono text-[11px] font-medium text-emerald-400/80 bg-emerald-950/30 border border-emerald-900/40 rounded-lg hover:bg-emerald-950/50 hover:text-emerald-300 transition-all"
            >
              New game
            </button>

            {!rematchOffer && !rematchOfferSent && (
              <button
                onClick={() =>
                  activeGame &&
                  offerRematch(activeGame.gameId, activeGame.timeControl)
                }
                className="flex-1 py-2.5 font-mono text-[11px] font-medium text-sky-400/80 bg-sky-950/20 border border-sky-900/30 rounded-lg hover:bg-sky-950/40 hover:text-sky-300 transition-all"
              >
                Rematch
              </button>
            )}
            {rematchOfferSent === DRAW_OFFER.SENT && (
              <div className="flex-1 py-2.5 font-mono text-[11px] text-zinc-600 bg-zinc-900/40 border border-zinc-800/30 rounded-lg text-center">
                Sent...
              </div>
            )}
            {rematchOfferSent === DRAW_OFFER.DECLINE && (
              <div className="flex-1 py-2.5 font-mono text-[11px] text-rose-500/60 bg-rose-950/20 border border-rose-900/30 rounded-lg text-center">
                Declined
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
