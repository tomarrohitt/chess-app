"use client";

import { useGameStore } from "@/store/use-game-store";
import { useSocket } from "@/store/socket-provider";
import { MoveList } from "./move-list";
import { ActiveGame, DRAW_OFFER, GameOverState } from "@/types/chess";
import { Dispatch, SetStateAction } from "react";
import { RematchToast } from "./rematch-toast";

interface GameSidebarProps {
  activeGame: ActiveGame;
  isPlayer: boolean;
  setSpectatorFlipped: Dispatch<SetStateAction<boolean>>;
  currentMoveIndex?: number;
  onMoveClick?: (index: number) => void;
  gameOver: GameOverState | null;
}

export function GameSidebar({
  activeGame,
  isPlayer,
  setSpectatorFlipped,
  currentMoveIndex,
  onMoveClick,
  gameOver,
}: GameSidebarProps) {
  const { drawOffer, drawOfferSent, rematchOffer, rematchOfferSent } =
    useGameStore();

  const { resign, offerDraw, acceptDraw, declineDraw, offerRematch } =
    useSocket();

  if (!activeGame) return null;

  return (
    <div className="flex flex-col gap-3 w-60 shrink-0">
      <MoveList
        pgn={activeGame.pgn}
        timeControl={activeGame.timeControl}
        currentMoveIndex={currentMoveIndex}
        onMoveClick={onMoveClick}
      />

      {!isPlayer && (
        <button
          onClick={() => setSpectatorFlipped((prev) => !prev)}
          className="w-full py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-sm font-medium transition-all duration-150"
        >
          Flip Board
        </button>
      )}

      {isPlayer && !gameOver && !drawOfferSent && (
        <button
          onClick={() => offerDraw(activeGame.gameId)}
          className="w-full py-2.5 rounded-lg bg-zinc-900 hover:bg-red-950/60 border border-zinc-900 hover:border-red-800 text-zinc-400 hover:text-red-400 text-sm font-medium transition-all duration-150"
        >
          Draw
        </button>
      )}

      {isPlayer && !gameOver && drawOfferSent === DRAW_OFFER.SENT && (
        <div className="w-full py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
          <p className="text-sm text-zinc-400">Draw offer sent...</p>
        </div>
      )}

      {isPlayer && !gameOver && drawOfferSent === DRAW_OFFER.DECLINE && (
        <div className="w-full py-2.5 bg-red-950/60 border border-red-800 rounded-lg text-center">
          <p className="text-sm text-red-400">Draw declined</p>
        </div>
      )}

      {isPlayer && !gameOver && (
        <button
          onClick={() => resign(activeGame.gameId)}
          className="w-full py-2.5 rounded-lg bg-red-500 text-white hover:bg-red-950/60 border border-zinc-900 hover:border-red-800 hover:text-red-400 text-sm font-medium transition-all duration-150"
        >
          Resign
        </button>
      )}

      {isPlayer && !!drawOffer && (
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col gap-3">
          <p className="text-sm text-zinc-300 text-center">
            Opponent offered a draw
          </p>
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

      {isPlayer && gameOver && !rematchOfferSent && !rematchOffer && (
        <button
          onClick={() =>
            offerRematch(activeGame.gameId, activeGame.timeControl)
          }
          className="w-full py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 shadow-lg text-sm font-bold transition-all duration-150 mt-2"
        >
          Rematch
        </button>
      )}

      {isPlayer && gameOver && rematchOfferSent === DRAW_OFFER.SENT && (
        <div className="w-full py-2.5 bg-zinc-800 rounded-lg text-center mt-2">
          <p className="text-sm text-zinc-400 font-bold">
            Rematch offer sent...
          </p>
        </div>
      )}

      {isPlayer && gameOver && rematchOfferSent === DRAW_OFFER.DECLINE && (
        <div className="w-full py-2.5 bg-red-950/60 border border-red-800 rounded-lg text-center mt-2">
          <p className="text-sm text-red-400 font-bold">Rematch declined</p>
        </div>
      )}

      {rematchOffer && <RematchToast rematchOffer={rematchOffer} />}
    </div>
  );
}
