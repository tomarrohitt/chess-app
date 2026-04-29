"use client";

import { useEffect, useRef } from "react";
import { playAudio, getMoveSoundFile } from "@/lib/audio";
import { GameOverState } from "@/types/chess";

interface UseGameAudioProps {
  history: string[];
  currentMoveIndex: number;
  isPlayer: boolean;
  isWhite: boolean;
  userId: string;
  isArchive?: boolean;
  gameOver?: GameOverState | null;
  gameId?: string;
  drawOffer?: { gameId: string; offeredBy: string } | null;
  rematchOffer?: {
    gameId: string;
    timeControl: string;
  } | null;
}

export function useGameAudio({
  history,
  currentMoveIndex,
  isPlayer,
  isWhite,
  userId,
  isArchive = false,
  gameOver = null,
  gameId = undefined,
  drawOffer = null,
  rematchOffer = null,
}: UseGameAudioProps) {
  const prevHistoryLength = useRef(history.length);
  const prevMoveIndex = useRef(currentMoveIndex);

  useEffect(() => {
    const currentLength = history.length;
    let soundFile: string | null = null;

    if (!isArchive && currentLength > prevHistoryLength.current) {
      const lastMove = history[currentLength - 1];
      const isWhiteMove = currentLength % 2 !== 0;
      const isMyMove = isPlayer && isWhiteMove === isWhite;
      soundFile = getMoveSoundFile(lastMove, isMyMove, !isPlayer);
    } else if (currentMoveIndex !== prevMoveIndex.current) {
      if (currentMoveIndex >= 0) {
        const currentMove = history[currentMoveIndex];
        const isWhiteMove = (currentMoveIndex + 1) % 2 !== 0;
        const isMyMove = isPlayer && isWhiteMove === isWhite;

        soundFile = getMoveSoundFile(currentMove, isMyMove, !isPlayer);

        if (isArchive && currentMoveIndex === history.length - 1) {
          soundFile = "/game-end.mp3";
        }
      } else {
        soundFile = "/move-self.mp3";
      }
    }

    if (soundFile) {
      playAudio(soundFile);
    }

    prevHistoryLength.current = currentLength;
    prevMoveIndex.current = currentMoveIndex;
  }, [history, currentMoveIndex, isPlayer, isWhite, isArchive]);

  const prevGameOver = useRef<boolean>(false);
  useEffect(() => {
    if (!isArchive && gameOver && !prevGameOver.current) {
      playAudio("/game-end.mp3");
      prevGameOver.current = true;
    }
  }, [gameOver, isArchive]);

  // 3. Game Start Audio
  const prevGameId = useRef<string | null>(null);
  useEffect(() => {
    if (!isArchive && gameId && gameId !== prevGameId.current) {
      if (history.length === 0) {
        playAudio("/game-start.mp3");
      }
      prevGameId.current = gameId;
    }
  }, [gameId, history.length, isArchive]);

  // 4. Draw Offer Audio
  const prevDrawOffer = useRef<{ gameId: string; offeredBy: string } | null>(
    null,
  );
  useEffect(() => {
    if (
      !isArchive &&
      drawOffer &&
      drawOffer !== prevDrawOffer.current &&
      drawOffer.offeredBy !== userId
    ) {
      playAudio("/drawoffer.mp3");
    }
    prevDrawOffer.current = drawOffer;
  }, [drawOffer, userId, isArchive]);

  useEffect(() => {
    if (rematchOffer) {
      playAudio("/notify.mp3");
    }
  }, [rematchOffer, userId]);
}
