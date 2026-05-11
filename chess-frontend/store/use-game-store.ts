import { create } from "zustand";
import {
  ActiveGame,
  GameOverState,
  DrawOfferState,
  QueueStatus,
  GameStartedPayload,
  GameStatePayload,
  MoveMadePayload,
  RematchOfferState,
  ChallengeOfferState,
  DrawOffer,
} from "@/types/chess";
import { User } from "@/types/auth";
import { WsConnectionStatus } from "@/types/ws";
import { GameChatMessage } from "@/types/chat";
import * as gameActions from "./game-store-actions";
import { immer } from "zustand/middleware/immer";

export type GameState = {
  connectionStatus: WsConnectionStatus;
  user: User | null;
  queueStatus: QueueStatus;
  queueTimeControl: string | null;
  activeGame: ActiveGame | null;
  expectedGameId: string | null;
  gameOver: GameOverState | null;
  drawOffer: DrawOfferState | null;
  drawOfferSent: DrawOffer.SENT | DrawOffer.DECLINE | null;
  rematchOffer: RematchOfferState | null;
  rematchOfferSent: DrawOffer.SENT | DrawOffer.DECLINE | null;
  lastMoveRejectedReason: string | null;
  showAnimations: boolean;
  chatMessages: GameChatMessage[];
  incomingChallenge: ChallengeOfferState | null;
};

export type GameAction = {
  actions: {
    setConnection: (status: WsConnectionStatus) => void;
    setUser: (user: User | null) => void;
    setQueue: (status: QueueStatus, timeControl?: string | null) => void;
    setExpectedGameId: (gameId: string | null) => void;
    setDrawOffer: (offer: DrawOfferState | null) => void;
    setDrawOfferSent: (
      status: DrawOffer.SENT | DrawOffer.DECLINE | null,
    ) => void;
    setRematchOffer: (offer: RematchOfferState | null) => void;
    setRematchOfferSent: (
      status: DrawOffer.SENT | DrawOffer.DECLINE | null,
    ) => void;
    setAnimations: (enabled: boolean) => void;
    setIncomingChallenge: (challenge: ChallengeOfferState | null) => void;
    handleGameStarted: (p: GameStartedPayload) => void;
    handleGameState: (p: GameStatePayload) => void;
    handleMoveMade: (p: MoveMadePayload) => void;
    handleMoveRejected: (reason: string) => void;
    handleGameOver: (p: GameOverState) => void;
    addChatMessage: (msg: GameChatMessage) => void;
    resetGame: () => void;
  };
};

export type GameStore = GameState & GameAction;

const initialState: GameState = {
  connectionStatus: WsConnectionStatus.IDLE,
  user: null,
  queueStatus: QueueStatus.IDLE,
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
  incomingChallenge: null,
};

export const useGameStore = create<GameStore>()(
  immer((set) => ({
    ...initialState,
    actions: {
      setConnection: (status) =>
        set((state) => gameActions.setConnection(state, status)),
      setUser: (user) => set((state) => gameActions.setUser(state, user)),
      setQueue: (status, timeControl) =>
        set((state) => gameActions.setQueue(state, status, timeControl)),
      setExpectedGameId: (gameId) =>
        set((state) => gameActions.setExpectedGameId(state, gameId)),
      setDrawOffer: (offer) =>
        set((state) => gameActions.setDrawOffer(state, offer)),
      setDrawOfferSent: (status) =>
        set((state) => gameActions.setDrawOfferSent(state, status)),
      setRematchOffer: (offer) =>
        set((state) => gameActions.setRematchOffer(state, offer)),
      setRematchOfferSent: (status) =>
        set((state) => gameActions.setRematchOfferSent(state, status)),
      setAnimations: (enabled) =>
        set((state) => gameActions.setAnimations(state, enabled)),
      setIncomingChallenge: (challenge) =>
        set((state) => gameActions.setIncomingChallenge(state, challenge)),
      handleGameStarted: (p) =>
        set((state) => gameActions.handleGameStarted(state, p)),
      handleGameState: (p) =>
        set((state) => gameActions.handleGameState(state, p)),
      handleMoveMade: (p) =>
        set((state) => gameActions.handleMoveMade(state, p)),
      handleMoveRejected: (reason) => {
        set((state) => gameActions.setLastMoveRejectedReason(state, reason));
        setTimeout(
          () =>
            set((state) => gameActions.setLastMoveRejectedReason(state, null)),
          3000,
        );
      },
      handleGameOver: (p) =>
        set((state) => gameActions.handleGameOver(state, p)),
      addChatMessage: (msg) =>
        set((state) => gameActions.addChatMessage(state, msg)),
      resetGame: () => set(gameActions.resetGame),
    },
  })),
);
