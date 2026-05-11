import { useGameStore } from "@/store/use-game-store";
import { useGameUIStore } from "./use-game-ui-store";
import { PlayerColor } from "@/types/chess";

export function useGameContext(userId: string) {
  const activeGame = useGameStore((s) => s.activeGame);
  const spectatorFlipped = useGameUIStore((s) => s.spectatorFlipped);

  const isPlayer =
    userId === activeGame?.white.id || userId === activeGame?.black.id;

  const playerIsWhite = userId === activeGame?.white.id;

  const isViewingWhite = isPlayer
    ? playerIsWhite
    : spectatorFlipped
      ? false
      : true;

  const topColor = isViewingWhite ? PlayerColor.BLACK : PlayerColor.WHITE;
  const bottomColor = isViewingWhite ? PlayerColor.WHITE : PlayerColor.BLACK;

  const topPlayer =
    topColor === PlayerColor.WHITE ? activeGame?.white : activeGame?.black;
  const bottomPlayer =
    bottomColor === PlayerColor.WHITE ? activeGame?.white : activeGame?.black;

  return {
    isPlayer,
    isWhite: isPlayer ? playerIsWhite : isViewingWhite,
    isViewingWhite,
    topColor,
    bottomColor,
    topPlayer,
    bottomPlayer,
  };
}
