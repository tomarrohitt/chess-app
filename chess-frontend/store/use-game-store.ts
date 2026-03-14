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
} from "@/types/chess";
import { User } from "@/types/auth";

interface GameStore {
  connectionStatus: WsConnectionStatus;
  user: User | null;
  queueStatus: QueueStatus;
  queueTimeControl: string | null;
  activeGame: ActiveGame | null;
  gameOver: GameOverState | null;
  drawOffer: DrawOfferState | null;
  drawOfferSent: "sent" | "declined" | null;
  lastMoveRejectedReason: string | null;
  showAnimations: boolean;

  setConnection: (status: WsConnectionStatus) => void;
  setUser: (user: User | null) => void;
  setQueue: (status: QueueStatus, timeControl?: string | null) => void;
  setDrawOffer: (offer: DrawOfferState | null) => void;
  setDrawOfferSent: (status: "sent" | "declined" | null) => void;
  setAnimations: (enabled: boolean) => void;
  handleGameStarted: (p: GameStartedPayload) => void;
  handleGameState: (p: GameStatePayload) => void;
  handleMoveMade: (p: MoveMadePayload) => void;
  handleMoveRejected: (reason: string) => void;
  handleGameOver: (p: GameOverState) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  connectionStatus: "idle",
  user: null,
  queueStatus: "idle",
  queueTimeControl: null,
  activeGame: null,
  gameOver: null,
  drawOffer: null,
  drawOfferSent: null,
  lastMoveRejectedReason: null,
  showAnimations: true,

  setConnection: (connectionStatus) => set({ connectionStatus }),
  setUser: (user) => set({ user }),
  setQueue: (queueStatus, timeControl = null) =>
    set({ queueStatus, queueTimeControl: timeControl }),
  setDrawOffer: (drawOffer) => set({ drawOffer }),
  setDrawOfferSent: (drawOfferSent) => set({ drawOfferSent }),
  setAnimations: (showAnimations) => set({ showAnimations }),

  handleGameStarted: (p) =>
    set((state) => {
      const [mins] = p.timeControl.split("+").map(Number);
      const baseMs = mins * 60 * 1000;
      return {
        queueStatus: "idle",
        queueTimeControl: null,
        gameOver: null,
        activeGame: {
          gameId: p.gameId,
          fen: p.fen,
          pgn: "",
          turn: "w",
          playerColor: p.color === "white" ? "w" : "b",
          whiteId: p.players.white.id,
          blackId: p.players.black.id,
          whiteName: p.players.white.username,
          blackName: p.players.black.username,
          whiteRating: p.players.white.rating,
          blackRating: p.players.black.rating,
          whiteImage: p.players.white.image,
          blackImage: p.players.black.image,
          timeControl: p.timeControl,
          whiteTimeMs: baseMs,
          blackTimeMs: baseMs,
          status: GameStatus.IN_PROGRESS,
        },
      };
    }),

  handleGameState: (p) =>
    set((state) => ({
      activeGame: {
        gameId: p.gameId,
        fen: p.fen,
        pgn: p.pgn ?? "",
        turn: p.turn,
        playerColor:
          p.playerColor || (state.user?.id === p.whiteId ? "w" : "b"),
        whiteId: p.whiteId,
        blackId: p.blackId,
        whiteName: p.whiteName || "White",
        blackName: p.blackName || "Black",
        whiteRating: p.whiteRating,
        blackRating: p.blackRating,
        whiteImage: p.whiteImage,
        blackImage: p.blackImage,
        timeControl: p.timeControl,
        whiteTimeMs: p.whiteTimeLeftMs,
        blackTimeMs: p.blackTimeLeftMs,
        status: GameStatus.IN_PROGRESS,
      },
    })),

  handleMoveMade: (p) =>
    set((state) => {
      if (!state.activeGame || state.activeGame.gameId !== p.gameId)
        return state;
      return {
        activeGame: {
          ...state.activeGame,
          fen: p.fen,
          pgn: p.pgn,
          turn: state.activeGame.turn === "w" ? "b" : "w",
          whiteTimeMs: p.whiteTimeMs,
          blackTimeMs: p.blackTimeMs,
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
    })),

  resetGame: () =>
    set({
      activeGame: null,
      gameOver: null,
      queueStatus: "idle",
      queueTimeControl: null,
      drawOffer: null,
      drawOfferSent: null,
    }),
}));
