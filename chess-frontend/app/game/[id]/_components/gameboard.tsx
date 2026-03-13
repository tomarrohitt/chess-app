"use client";
import { useGameStore } from "@/store/use-game-store";
import { Chessboard } from "react-chessboard";
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
  const game = useGameStore((s) => s.activeGame);
  const gameOver = useGameStore((s) => s.gameOver);
  const showAnimations = useGameStore((s) => s.showAnimations);
  const rejectedReason = useGameStore((s) => s.lastMoveRejectedReason);
  const { makeMove, resign } = useSocket();

  const isWhite = game?.playerColor === "w";

  const topColor = isWhite ? "b" : "w";
  const bottomColor = isWhite ? "w" : "b";
  const topId = topColor === "w" ? game?.whiteId : game?.blackId;
  const bottomId = bottomColor === "w" ? game?.whiteId : game?.blackId;

  if (!game || game.gameId !== gameId) {
    return (
      <LobbyClient user={user} />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="flex gap-4 items-start w-full max-w-5xl">

        <div className="flex flex-col gap-2 min-w-0 flex-1 max-w-[560px]">
          <PlayerCard
            userId={topId ?? "?"}
            color={topColor}
            timeMs={topColor === "w" ? game.whiteTimeMs : game.blackTimeMs}
            isActive={game.turn === topColor && game.status === GameStatus.IN_PROGRESS}
          />

          <div className="relative">
            <Chessboard
              options={{
                position: game.fen,
                showAnimations: true,
                boardOrientation: isWhite ? "white" : "black",
                onPieceDrop: ({ sourceSquare, targetSquare }) => {
                  if (!targetSquare) return false;
                  makeMove(game.gameId, sourceSquare, targetSquare);
                  return true;
                },
                darkSquareStyle: { backgroundColor: "#4a7c59" },
                lightSquareStyle: { backgroundColor: "#f0d9b5" },
              }}
            />

            {rejectedReason && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-600/90 text-white text-xs px-3 py-1.5 rounded-full whitespace-nowrap">
                {rejectedReason}
              </div>
            )}

            {gameOver && (
              <GameOverOverlay gameOver={gameOver} userId={user.id} />
            )}
          </div>

          <PlayerCard
            userId={bottomId ?? user.username}
            color={bottomColor}
            timeMs={bottomColor === "w" ? game.whiteTimeMs : game.blackTimeMs}
            isActive={game.turn === bottomColor && game.status === GameStatus.IN_PROGRESS}
          />
        </div>

        <div className="flex flex-col gap-3 w-60 flex-shrink-0">
          <MoveList pgn={game.pgn} />



          {!gameOver && (
            <button
              onClick={() => resign(game.gameId)}
              className="w-full py-2.5 rounded-lg bg-zinc-900 hover:bg-red-950/60 border border-zinc-900 hover:border-red-800 text-zinc-400 hover:text-red-400 text-sm font-medium transition-all duration-150"
            >
              Resign
            </button>
          )}
        </div>
      </div>
    </div>
  );
}