import { useCallback } from "react";
import { useGameUIStore } from "./use-game-ui-store";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation";

export function useGameNavigation(latestIndex: number) {
  const { setViewingIndex } = useGameUIStore((s) => s.actions);
  const viewingIndex = useGameUIStore((s) => s.viewingIndex);

  const go = useCallback(
    (updater: (cur: number) => number | null) =>
      setViewingIndex((prev) => {
        const cur = prev !== null ? prev : latestIndex;
        const next = updater(cur);
        return next === latestIndex ? null : next;
      }),
    [latestIndex, setViewingIndex],
  );

  useKeyboardNavigation({
    onArrowLeft: () => go((cur) => Math.max(-1, cur - 1)),
    onArrowRight: () => go((cur) => Math.min(latestIndex, cur + 1)),
    onArrowUp: () => setViewingIndex(-1),
    onArrowDown: () => setViewingIndex(null),
  });

  return {
    currentMoveIndex: viewingIndex !== null ? viewingIndex : latestIndex,
    isViewingHistory: viewingIndex !== null,
    handleMoveClick: useCallback(
      (index: number) => setViewingIndex(index === latestIndex ? null : index),
      [latestIndex, setViewingIndex],
    ),
  };
}
