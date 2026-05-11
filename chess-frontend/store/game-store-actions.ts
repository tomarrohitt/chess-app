import {
  ActiveGame,
  ChallengeOfferState,
  DrawOffer,
  DrawOfferState,
  FullColor,
  GameOverState,
  GameStartedPayload,
  GameStatePayload,
  GameStatus,
  MoveMadePayload,
  PlayerColor,
  QueueStatus,
  RematchOfferState,
} from "@/types/chess";
import { User } from "@/types/auth";
import { WsConnectionStatus } from "@/types/ws";
import { GameState } from "./use-game-store";
import { GameChatMessage } from "@/types/chat";

export const setConnection = (state: GameState, status: WsConnectionStatus) => {
  state.connectionStatus = status;
};

export const setUser = (state: GameState, user: User | null) => {
  state.user = user;
};

export const setQueue = (
  state: GameState,
  status: QueueStatus,
  timeControl?: string | null,
) => {
  state.queueStatus = status;
  state.queueTimeControl = timeControl ?? null;
};

export const setExpectedGameId = (state: GameState, gameId: string | null) => {
  state.expectedGameId = gameId;
};

export const setDrawOffer = (
  state: GameState,
  offer: DrawOfferState | null,
) => {
  state.drawOffer = offer;
};

export const setDrawOfferSent = (
  state: GameState,
  status: DrawOffer.SENT | DrawOffer.DECLINE | null,
) => {
  state.drawOfferSent = status;
};

export const setRematchOffer = (
  state: GameState,
  offer: RematchOfferState | null,
) => {
  state.rematchOffer = offer;
};

export const setRematchOfferSent = (
  state: GameState,
  status: DrawOffer.SENT | DrawOffer.DECLINE | null,
) => {
  state.rematchOfferSent = status;
};

export const setAnimations = (state: GameState, enabled: boolean) => {
  state.showAnimations = enabled;
};

export const setIncomingChallenge = (
  state: GameState,
  challenge: ChallengeOfferState | null,
) => {
  state.incomingChallenge = challenge;
};

export const handleGameStarted = (state: GameState, p: GameStartedPayload) => {
  const [mins] = p.timeControl.split("+").map(Number);
  const baseMs = mins * 60 * 1000;

  state.queueStatus = QueueStatus.IDLE;
  state.queueTimeControl = null;
  state.gameOver = null;
  state.rematchOffer = null;
  state.rematchOfferSent = null;
  state.chatMessages = [];
  state.incomingChallenge = null;
  state.activeGame = {
    gameId: p.gameId,
    fen: p.fen,
    pgn: "",
    turn: PlayerColor.WHITE,
    playerColor:
      p.color === FullColor.WHITE ? PlayerColor.WHITE : PlayerColor.BLACK,
    white: { ...p.white, timeLeftMs: baseMs, capturedPieces: [] },
    black: { ...p.black, timeLeftMs: baseMs, capturedPieces: [] },
    timeControl: p.timeControl,
    status: GameStatus.IN_PROGRESS,
  };
};

export const handleGameState = (state: GameState, p: GameStatePayload) => {
  if (
    state.activeGame &&
    state.activeGame.gameId !== p.gameId &&
    state.expectedGameId !== p.gameId
  ) {
    return;
  }

  if (!state.activeGame) {
    state.activeGame = {} as ActiveGame;
  }

  state.activeGame.gameId = p.gameId;
  state.activeGame.fen = p.fen;
  state.activeGame.pgn = p.pgn;
  state.activeGame.turn = p.turn;
  state.activeGame.playerColor = p.playerColor;
  state.activeGame.timeControl = p.timeControl;
  state.activeGame.status = state.gameOver ? state.gameOver.status : p.status;
  state.activeGame.white = {
    ...p.white,
    timeLeftMs: p.white.timeLeftMs,
  };
  state.activeGame.black = {
    ...p.black,
    timeLeftMs: p.black.timeLeftMs,
  };

  state.expectedGameId = null;
};

export const handleMoveMade = (state: GameState, p: MoveMadePayload) => {
  if (!state.activeGame || state.activeGame.gameId !== p.gameId) {
    return;
  }

  state.drawOffer = null;
  state.drawOfferSent = null;
  state.activeGame.fen = p.fen;
  state.activeGame.pgn = p.pgn;
  state.activeGame.turn =
    state.activeGame.turn === PlayerColor.WHITE
      ? PlayerColor.BLACK
      : PlayerColor.WHITE;
  state.activeGame.white.timeLeftMs = p.white.timeLeftMs;
  state.activeGame.white.capturedPieces = p.white.capturedPieces;
  state.activeGame.black.timeLeftMs = p.black.timeLeftMs;
  state.activeGame.black.capturedPieces = p.black.capturedPieces;
  state.activeGame.status = p.isGameOver
    ? GameStatus.CHECKMATE
    : GameStatus.IN_PROGRESS;
};

export const setLastMoveRejectedReason = (
  state: GameState,
  reason: string | null,
) => {
  state.lastMoveRejectedReason = reason;
};

export const handleGameOver = (state: GameState, p: GameOverState) => {
  if (state.activeGame) {
    state.activeGame.status = p.status;
  }
  state.gameOver = { status: p.status, winnerId: p.winnerId, reason: p.reason };
  state.drawOffer = null;
  state.drawOfferSent = null;
  state.rematchOffer = null;
  state.rematchOfferSent = null;
};

export const addChatMessage = (state: GameState, msg: GameChatMessage) => {
  if (state.activeGame?.gameId !== msg.gameId) {
    return;
  }
  state.chatMessages.push(msg);
};

export const resetGame = (state: GameState) => {
  state.activeGame = null;
  state.expectedGameId = null;
  state.gameOver = null;
  state.queueStatus = QueueStatus.IDLE;
  state.queueTimeControl = null;
  state.drawOffer = null;
  state.drawOfferSent = null;
  state.rematchOffer = null;
  state.rematchOfferSent = null;
  state.chatMessages = [];
};
