import { create } from "zustand";
import {
  ActiveGame,
  GameOverState,
  DrawOfferState,
  QueueStatus,
  WsConnectionStatus,
  GameStatus,
  GameStartedPayload,
  GameStatePayload,
  MoveMadePayload,
  PLAYER_COLOR,
  COLOR,
  QUEUE_STATUS,
  DRAW_OFFER,
  WS_CONNECTION_STATUS,
  RematchOfferState,
  ChatMessagePayload,
} from "@/types/chess";
import { User } from "@/types/auth";

interface GameStore {
  connectionStatus: WsConnectionStatus;
  user: User | null;
  queueStatus: QueueStatus;
  queueTimeControl: string | null;
  activeGame: ActiveGame | null;
  expectedGameId: string | null;
  gameOver: GameOverState | null;
  drawOffer: DrawOfferState | null;
  drawOfferSent: DRAW_OFFER.SENT | DRAW_OFFER.DECLINE | null;
  rematchOffer: RematchOfferState | null;
  rematchOfferSent: DRAW_OFFER.SENT | DRAW_OFFER.DECLINE | null;
  lastMoveRejectedReason: string | null;
  showAnimations: boolean;
  chatMessages: ChatMessagePayload[];

  setConnection: (status: WsConnectionStatus) => void;
  setUser: (user: User | null) => void;
  setQueue: (status: QueueStatus, timeControl?: string | null) => void;
  setExpectedGameId: (gameId: string | null) => void;
  setDrawOffer: (offer: DrawOfferState | null) => void;
  setDrawOfferSent: (
    status: DRAW_OFFER.SENT | DRAW_OFFER.DECLINE | null,
  ) => void;
  setRematchOffer: (offer: RematchOfferState | null) => void;
  setRematchOfferSent: (
    status: DRAW_OFFER.SENT | DRAW_OFFER.DECLINE | null,
  ) => void;
  setAnimations: (enabled: boolean) => void;
  handleGameStarted: (p: GameStartedPayload) => void;
  handleGameState: (p: GameStatePayload) => void;
  handleMoveMade: (p: MoveMadePayload) => void;
  handleMoveRejected: (reason: string) => void;
  handleGameOver: (p: GameOverState) => void;
  addChatMessage: (msg: ChatMessagePayload) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  connectionStatus: WS_CONNECTION_STATUS.IDLE,
  user: null,
  queueStatus: QUEUE_STATUS.IDLE,
  queueTimeControl: null,
  activeGame: null,
  expectedGameId: null,
  gameOver: null,
  drawOffer: null,
  drawOfferSent: null,
  rematchOffer: null,
  rematchOfferSent: null,
  lastMoveRejectedReason: null,
  showAnimations: true,
  chatMessages: [],

  setConnection: (connectionStatus) => set({ connectionStatus }),
  setUser: (user) => set({ user }),
  setQueue: (queueStatus, timeControl = null) =>
    set({ queueStatus, queueTimeControl: timeControl }),
  setExpectedGameId: (expectedGameId) => set({ expectedGameId }),
  setDrawOffer: (drawOffer) => set({ drawOffer }),
  setDrawOfferSent: (drawOfferSent) => set({ drawOfferSent }),
  setRematchOffer: (rematchOffer) => set({ rematchOffer }),
  setRematchOfferSent: (rematchOfferSent) => set({ rematchOfferSent }),
  setAnimations: (showAnimations) => set({ showAnimations }),

  handleGameStarted: (p) =>
    set(() => {
      const [mins] = p.timeControl.split("+").map(Number);
      const baseMs = mins * 60 * 1000;
      return {
        queueStatus: QUEUE_STATUS.IDLE,
        queueTimeControl: null,
        gameOver: null,
        rematchOffer: null,
        rematchOfferSent: null,
        chatMessages: [], // Clear chat when a new game starts
        activeGame: {
          gameId: p.gameId,
          fen: p.fen,
          pgn: "",
          turn: PLAYER_COLOR.WHITE,
          playerColor:
            p.color === COLOR.WHITE ? PLAYER_COLOR.WHITE : PLAYER_COLOR.BLACK,
          white: { ...p.white, timeLeftMs: baseMs, capturedPieces: [] },
          black: { ...p.black, timeLeftMs: baseMs, capturedPieces: [] },

          timeControl: p.timeControl,
          status: GameStatus.IN_PROGRESS,
        },
      };
    }),

  handleGameState: (p) =>
    set((state) => {
      if (
        state.activeGame &&
        state.activeGame.gameId !== p.gameId &&
        state.expectedGameId !== p.gameId
      ) {
        return state;
      }
      return {
        activeGame: {
          ...state.activeGame,
          gameId: p.gameId,
          fen: p.fen,
          pgn: p.pgn,
          turn: p.turn,
          playerColor: p.playerColor,
          white: p.white,
          black: p.black,
          timeControl: p.timeControl,
          status: state.gameOver ? state.gameOver.status : p.status,
        } as ActiveGame,
        expectedGameId: null,
      };
    }),

  handleMoveMade: (p) =>
    set((state) => {
      if (!state.activeGame || state.activeGame.gameId !== p.gameId)
        return state;
      return {
        drawOffer: null,
        drawOfferSent: null,
        activeGame: {
          ...state.activeGame,
          fen: p.fen,
          pgn: p.pgn,
          turn:
            state.activeGame.turn === PLAYER_COLOR.WHITE
              ? PLAYER_COLOR.BLACK
              : PLAYER_COLOR.WHITE,
          white: {
            ...state.activeGame.white,
            timeLeftMs: p.white.timeLeftMs,
            capturedPieces: p.white.capturedPieces,
          },
          black: {
            ...state.activeGame.black,
            timeLeftMs: p.black.timeLeftMs,
            capturedPieces: p.black.capturedPieces,
          },
          status: p.isGameOver ? GameStatus.CHECKMATE : GameStatus.IN_PROGRESS,
        },
      };
    }),

  handleMoveRejected: (reason) => {
    set({ lastMoveRejectedReason: reason });
    setTimeout(() => set({ lastMoveRejectedReason: null }), 3000);
  },

  handleGameOver: (p) =>
    set((state) => ({
      activeGame: state.activeGame
        ? { ...state.activeGame, status: p.status }
        : null,
      gameOver: { status: p.status, winnerId: p.winnerId, reason: p.reason },
      drawOffer: null,
      drawOfferSent: null,
      rematchOffer: null,
      rematchOfferSent: null,
    })),

  addChatMessage: (msg: ChatMessagePayload) =>
    set((state) => {
      if (state.activeGame?.gameId !== msg.gameId) {
        return state;
      }
      const { gameId, ...rest } = msg;
      return { chatMessages: [...state.chatMessages, rest] };
    }),

  resetGame: () =>
    set({
      activeGame: null,
      expectedGameId: null,
      gameOver: null,
      queueStatus: QUEUE_STATUS.IDLE,
      queueTimeControl: null,
      drawOffer: null,
      drawOfferSent: null,
      rematchOffer: null,
      rematchOfferSent: null,
      chatMessages: [],
    }),
}));
