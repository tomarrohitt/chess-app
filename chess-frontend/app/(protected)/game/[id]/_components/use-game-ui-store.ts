import { create } from "zustand";

interface GameUIStore {
  spectatorFlipped: boolean;
  viewingIndex: number | null;
  actions: {
    setSpectatorFlipped: (v: boolean | ((prev: boolean) => boolean)) => void;
    setViewingIndex: (
      v: number | null | ((prev: number | null) => number | null),
    ) => void;
    reset: () => void;
  };
}

export const useGameUIStore = create<GameUIStore>((set) => ({
  spectatorFlipped: false,
  viewingIndex: null,
  actions: {
    setSpectatorFlipped: (v) =>
      set((s) => ({
        spectatorFlipped: typeof v === "function" ? v(s.spectatorFlipped) : v,
      })),
    setViewingIndex: (v) =>
      set((s) => ({
        viewingIndex: typeof v === "function" ? v(s.viewingIndex) : v,
      })),
    reset: () => set({ spectatorFlipped: false, viewingIndex: null }),
  },
}));
