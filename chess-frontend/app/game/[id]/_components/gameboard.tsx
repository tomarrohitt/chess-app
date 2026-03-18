"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { useGameStore } from "@/store/use-game-store";
import { Chess } from "chess.js";
import { User } from "@/types/auth";

import { GameStatus, PLAYER_COLOR } from "@/types/chess";
import { useSocket } from "@/store/socket-provider";
import { LobbyClient } from "@/components/game/lobby-client";
import { GameSidebar } from "./game-sidebar";
import { ActiveBoard } from "./active-board";
import { PlayerArea } from "./player-area";
import { getPlayerAdvantages, getCapturedPieces } from "./advantage";

interface GameboardProps {
  gameId: string;
  user: User;
}

export function Gameboard({ gameId, user }: GameboardProps) {
  const { activeGame, gameOver, lastMoveRejectedReason } = useGameStore(
    (s) => s,
  );
  const { spectateGame, leaveSpectator } = useSocket();

  const [spectatorFlipped, setSpectatorFlipped] = useState(false);

  const isPlayer =
    user.id === activeGame?.white.id || user.id === activeGame?.black.id;
  const isWhite = isPlayer
    ? user.id === activeGame?.white.id
    : !spectatorFlipped;

  const topColor = isWhite ? PLAYER_COLOR.BLACK : PLAYER_COLOR.WHITE;
  const bottomColor = isWhite ? PLAYER_COLOR.WHITE : PLAYER_COLOR.BLACK;

  const opponentId = isWhite ? activeGame?.black.id : activeGame?.white.id;

  // Generate the timeline of FENs from the live PGN
  const timeline = useMemo(() => {
    const chess = new Chess();
    if (activeGame?.pgn) {
      chess.loadPgn(activeGame.pgn);
    }
    const history = chess.history();

    const temp = new Chess();
    const fens = [temp.fen({ forceEnpassantSquare: true })]; // Start position
    for (const move of history) {
      temp.move(move);
      fens.push(temp.fen({ forceEnpassantSquare: true }));
    }
    return { history, fens };
  }, [activeGame?.pgn]);

  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const latestIndex = timeline.history.length - 1;

  // Listen for keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setViewingIndex((prev) => {
          const currentIndex = prev !== null ? prev : latestIndex;
          return Math.max(-1, currentIndex - 1);
        });
      } else if (e.key === "ArrowRight") {
        setViewingIndex((prev) => {
          const currentIndex = prev !== null ? prev : latestIndex;
          const nextIndex = Math.min(latestIndex, currentIndex + 1);
          return nextIndex === latestIndex ? null : nextIndex;
        });
      } else if (e.key === "ArrowUp") {
        setViewingIndex(-1); // Jump to start
      } else if (e.key === "ArrowDown") {
        setViewingIndex(null); // Jump to end
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [latestIndex]);

  const handleMoveClick = (index: number) => {
    setViewingIndex(index === latestIndex ? null : index);
  };

  const currentMoveIndex = viewingIndex !== null ? viewingIndex : latestIndex;

  // Track the history length to detect when a new move is actually played
  const prevHistoryLength = useRef(timeline.history.length);
  const prevMoveIndex = useRef(currentMoveIndex);

  useEffect(() => {
    const currentLength = timeline.history.length;
    let soundFile: string | null = null;

    if (currentLength > prevHistoryLength.current) {
      const lastMove = timeline.history[currentLength - 1];

      const isWhiteMove = currentLength % 2 !== 0;
      const isMyMove = isPlayer && isWhiteMove === isWhite;
      soundFile = isMyMove ? "/move-self.mp3" : "/move-opponent.mp3";

      if (lastMove.includes("=")) {
        soundFile = "/promote.mp3";
      } else if (lastMove.includes("+") || lastMove.includes("#")) {
        soundFile = "/move-check.mp3";
      } else if (lastMove.includes("O-O")) {
        soundFile = "/castle.mp3";
      } else if (lastMove.includes("x")) {
        soundFile = "/capture.mp3";
      }
    } else if (currentMoveIndex !== prevMoveIndex.current) {
      if (currentMoveIndex >= 0) {
        const currentMove = timeline.history[currentMoveIndex];
        const isWhiteMove = (currentMoveIndex + 1) % 2 !== 0;
        const isMyMove = isPlayer && isWhiteMove === isWhite;

        soundFile = isMyMove ? "/move-self.mp3" : "/move-opponent.mp3";
        if (!isPlayer) soundFile = "/move-self.mp3";

        if (currentMove.includes("=")) {
          soundFile = "/promote.mp3";
        } else if (currentMove.includes("+") || currentMove.includes("#")) {
          soundFile = "/move-check.mp3";
        } else if (currentMove.includes("O-O")) {
          soundFile = "/castle.mp3";
        } else if (currentMove.includes("x")) {
          soundFile = "/capture.mp3";
        }
      } else {
        soundFile = "/move-self.mp3";
      }
    }

    if (soundFile) {
      const audio = new Audio(soundFile);
      audio
        .play()
        .catch((e) => console.log("Audio play blocked by browser:", e));
    }

    prevHistoryLength.current = currentLength;
    prevMoveIndex.current = currentMoveIndex;
  }, [timeline.history, currentMoveIndex, isPlayer, isWhite]);

  // Track game over state to play end-of-match sounds
  const prevGameOver = useRef<boolean>(false);
  useEffect(() => {
    if (gameOver && !prevGameOver.current) {
      let soundFile = "/game-draw.mp3"; // Default to draw

      if (gameOver.winnerId === user.id) {
        soundFile = "/game-win.mp3";
      } else if (gameOver.winnerId) {
        soundFile = "/game-lose.mp3";
      }

      const audio = new Audio(soundFile);
      audio
        .play()
        .catch((e) => console.log("Audio play blocked by browser:", e));
      prevGameOver.current = true;
    }
  }, [gameOver, user.id]);

  useEffect(() => {
    spectateGame(gameId);
    return () => {
      leaveSpectator(gameId);
    };
  }, [gameId, spectateGame, leaveSpectator]);

  if (!activeGame || activeGame.gameId !== gameId) {
    return <LobbyClient user={user} />;
  }

  const currentFen = timeline.fens[currentMoveIndex + 1] || activeGame.fen;
  const isViewingHistory = viewingIndex !== null;

  const { capturedByWhite, capturedByBlack } = getCapturedPieces(currentFen);
  const dynamicWhite = { ...activeGame.white, capturedPieces: capturedByWhite };
  const dynamicBlack = { ...activeGame.black, capturedPieces: capturedByBlack };

  const topPlayer =
    topColor === PLAYER_COLOR.WHITE ? dynamicWhite : dynamicBlack;
  const bottomPlayer =
    bottomColor === PLAYER_COLOR.WHITE ? dynamicWhite : dynamicBlack;

  const { topAdvantage, bottomAdvantage } = getPlayerAdvantages(
    dynamicWhite.capturedPieces,
    dynamicBlack.capturedPieces,
    topColor,
  );

  const currentTurnStr = activeGame.fen.split(" ")[1];
  const isTopActive = topColor === currentTurnStr;
  const isBottomActive = bottomColor === currentTurnStr;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="flex gap-4 items-start w-full max-w-5xl">
        <div className="flex flex-col gap-2 min-w-0 flex-1 max-w-140">
          <PlayerArea
            player={topPlayer!}
            color={topColor}
            isActive={
              isTopActive && activeGame.status === GameStatus.IN_PROGRESS
            }
            materialAdvantage={topAdvantage}
            position="top"
          />

          <ActiveBoard
            activeGame={activeGame}
            isPlayer={isPlayer}
            isWhite={isWhite}
            lastMoveRejectedReason={lastMoveRejectedReason}
            gameOver={gameOver}
            userId={user.id}
            currentFen={currentFen}
            isViewingHistory={isViewingHistory}
          />

          <PlayerArea
            player={bottomPlayer!}
            color={bottomColor}
            isActive={
              isBottomActive && activeGame.status === GameStatus.IN_PROGRESS
            }
            materialAdvantage={bottomAdvantage}
            position="bottom"
          />
        </div>

        <GameSidebar
          isPlayer={isPlayer}
          opponentId={opponentId}
          setSpectatorFlipped={setSpectatorFlipped}
          {...({
            currentMoveIndex,
            onMoveClick: handleMoveClick,
          } as any)}
        />
      </div>
    </div>
  );
}
