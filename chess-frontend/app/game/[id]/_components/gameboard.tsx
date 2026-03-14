"use client";
import { useGameStore } from "@/store/use-game-store";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { User } from "@/types/auth";

import { GameStatus } from "@/types/chess";
import { useSocket } from "@/store/socket-provider";
import { PlayerCard } from "./player-card";
import { GameOverOverlay } from "./game-over-overlay";
import { MoveList } from "./move-list";
import { LobbyClient } from "@/components/game/lobby-client";

interface GameboardProps {
  gameId: string;
  user: User;
}

export function Gameboard({ gameId, user }: GameboardProps) {
  const { activeGame, gameOver, lastMoveRejectedReason, drawOffer, drawOfferSent } = useGameStore((s) => s);
  const { makeMove, resign, offerDraw, acceptDraw, declineDraw } = useSocket();
  const isWhite = activeGame?.playerColor === "w";

  const topColor = isWhite ? "b" : "w";
  const bottomColor = isWhite ? "w" : "b";

  const topName = topColor === "w" ? activeGame?.whiteName : activeGame?.blackName;
  const bottomName = bottomColor === "w" ? activeGame?.whiteName : activeGame?.blackName;

  const topRating = topColor === "w" ? activeGame?.whiteRating : activeGame?.blackRating;
  const bottomRating = bottomColor === "w" ? activeGame?.whiteRating : activeGame?.blackRating;

  const topImage = topColor === "w" ? activeGame?.whiteImage : activeGame?.blackImage;
  const bottomImage = bottomColor === "w" ? activeGame?.whiteImage : activeGame?.blackImage;

  if (!activeGame || activeGame.gameId !== gameId) {
    return (
      <LobbyClient user={user} />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="flex gap-4 items-start w-full max-w-5xl">

        <div className="flex flex-col gap-2 min-w-0 flex-1 max-w-140">
          <PlayerCard
            username={topName ?? "Opponent"}
            rating={topRating}
            image={topImage}
            color={topColor}
            timeMs={topColor === "w" ? activeGame.whiteTimeMs : activeGame.blackTimeMs}
            isActive={activeGame.turn === topColor && activeGame.status === GameStatus.IN_PROGRESS}
          />

          <div className="relative">
            <Chessboard
              options={{
                position: activeGame.fen,
                showAnimations: true,
                boardOrientation: isWhite ? "white" : "black",
                onPieceDrop: (sourceSquare, targetSquare) => {
                  const game = new Chess(activeGame.fen);
                  try {
                    // Optimistic update locally to prevent snapping back and ensure smooth animations
                    const move = game.move({
                      from: sourceSquare,
                      to: targetSquare,
                      promotion: "q",
                    });

                    if (move) {
                      useGameStore.setState((state) => ({
                        activeGame: state.activeGame ? { ...state.activeGame, fen: game.fen() } : null,
                      }));
                      makeMove(activeGame.gameId, sourceSquare, targetSquare, move.promotion);
                      return true;
                    }
                  } catch { }
                  return false;
                },
                darkSquareStyle: { backgroundColor: "#4a7c59" },
                lightSquareStyle: { backgroundColor: "#f0d9b5" },
              }}
            />

            {lastMoveRejectedReason && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-600/90 text-white text-xs px-3 py-1.5 rounded-full whitespace-nowrap">
                {lastMoveRejectedReason}
              </div>
            )}

            {gameOver && (
              <GameOverOverlay gameOver={gameOver} userId={user.id} />
            )}
          </div>

          <PlayerCard
            username={bottomName ?? "Opponent"}
            rating={bottomRating}
            image={bottomImage}
            color={bottomColor}
            timeMs={bottomColor === "w" ? activeGame.whiteTimeMs : activeGame.blackTimeMs}
            isActive={activeGame.turn === bottomColor && activeGame.status === GameStatus.IN_PROGRESS}
          />
        </div>

        <div className="flex flex-col gap-3 w-60 shrink-0">
          <MoveList pgn={activeGame.pgn} timeControl={activeGame.timeControl} />


          {!gameOver && !drawOfferSent && (
            <button
              onClick={() => offerDraw(activeGame.gameId)}
              className="w-full py-2.5 rounded-lg bg-zinc-900 hover:bg-red-950/60 border border-zinc-900 hover:border-red-800 text-zinc-400 hover:text-red-400 text-sm font-medium transition-all duration-150"
            >
              Draw
            </button>
          )}

          {!gameOver && drawOfferSent === "sent" && (
            <div className="w-full py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
              <p className="text-sm text-zinc-400">Draw offer sent...</p>
            </div>
          )}

          {!gameOver && drawOfferSent === "declined" && (
            <div className="w-full py-2.5 bg-red-950/60 border border-red-800 rounded-lg text-center">
              <p className="text-sm text-red-400">Draw declined</p>
            </div>
          )}

          {!gameOver && (
            <button
              onClick={() => resign(activeGame.gameId)}
              className="w-full py-2.5 rounded-lg bg-red-500 text-white hover:bg-red-950/60 border border-zinc-900 hover:border-red-800 hover:text-red-400 text-sm font-medium transition-all duration-150"
            >
              Resign
            </button>
          )}

          {!!drawOffer && (
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col gap-3">
              <p className="text-sm text-zinc-300 text-center">Opponent offered a draw</p>
              <div className="flex gap-2">
                <button
                  onClick={() => acceptDraw(activeGame.gameId)}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={() => declineDraw(activeGame.gameId)}
                  className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded transition-colors"
                >
                  Decline
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}