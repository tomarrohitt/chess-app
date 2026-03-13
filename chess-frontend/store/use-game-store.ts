import { create } from 'zustand';
import {
    ActiveGame, GameOverState, DrawOfferState, QueueStatus,
    WsConnectionStatus, GameStatus, GameStartedPayload, GameStatePayload, MoveMadePayload
} from "@/types/chess";
import { User } from "@/types/auth"


interface GameStore {
    connectionStatus: WsConnectionStatus;
    user: User | null;
    queueStatus: QueueStatus;
    activeGame: ActiveGame | null;
    gameOver: GameOverState | null;
    drawOffer: DrawOfferState | null;
    lastMoveRejectedReason: string | null;
    showAnimations: boolean;

    setConnection: (status: WsConnectionStatus) => void;
    setUser: (user: User | null) => void;
    setQueue: (status: QueueStatus) => void;
    setAnimations: (enabled: boolean) => void;
    handleGameStarted: (p: GameStartedPayload) => void;
    handleGameState: (p: GameStatePayload) => void;
    handleMoveMade: (p: MoveMadePayload) => void;
    handleMoveRejected: (reason: string) => void;
    handleGameOver: (p: any) => void;
    resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
    connectionStatus: "idle",
    user: null,
    queueStatus: "idle",
    activeGame: null,
    gameOver: null,
    drawOffer: null,
    lastMoveRejectedReason: null,
    showAnimations: true,

    setConnection: (connectionStatus) => set({ connectionStatus }),
    setUser: (user) => set({ user }),
    setQueue: (queueStatus) => set({ queueStatus }),
    setAnimations: (showAnimations) => set({ showAnimations }),

    handleGameStarted: (p) => {
        const [mins] = p.timeControl.split("+").map(Number);
        const baseMs = mins * 60 * 1000;
        set({
            queueStatus: "idle",
            gameOver: null,
            activeGame: {
                gameId: p.gameId,
                fen: p.fen,
                pgn: "",
                turn: "w",
                playerColor: p.playerColor,
                whiteId: p.players.white,
                blackId: p.players.black,
                timeControl: p.timeControl,
                whiteTimeMs: baseMs,
                blackTimeMs: baseMs,
                status: GameStatus.IN_PROGRESS,
            },
        });
    },

    handleGameState: (p) => set({
        activeGame: {
            gameId: p.gameId,
            fen: p.fen,
            pgn: p.pgn ?? "",
            turn: p.turn,
            playerColor: p.playerColor,
            whiteId: p.whiteId,
            blackId: p.blackId,
            timeControl: p.timeControl,
            whiteTimeMs: p.whiteTimeLeftMs,
            blackTimeMs: p.blackTimeLeftMs,
            status: GameStatus.IN_PROGRESS,
        },
    }),

    handleMoveMade: (p) => set((state) => {
        if (!state.activeGame || state.activeGame.gameId !== p.gameId) return state;
        return {
            activeGame: {
                ...state.activeGame,
                fen: p.fen,
                pgn: p.pgn,
                turn: state.activeGame.turn === "w" ? "b" : "w",
                whiteTimeMs: p.whiteTimeMs,
                blackTimeMs: p.blackTimeMs,
            }
        };
    }),

    handleMoveRejected: (reason) => {
        set({ lastMoveRejectedReason: reason });
        setTimeout(() => set({ lastMoveRejectedReason: null }), 3000);
    },

    handleGameOver: (p) => set((state) => ({
        activeGame: state.activeGame ? { ...state.activeGame, status: p.status } : null,
        gameOver: { status: p.status, winnerId: p.winnerId, reason: p.reason },
        drawOffer: null,
    })),

    resetGame: () => set({ activeGame: null, gameOver: null, queueStatus: "idle" }),
}));