import type { Config } from "chessground/config";

export const sharedBoardConfig: Partial<Config> = {
  animation: { enabled: true, duration: 200 },
  highlight: { lastMove: true, check: true },
  movable: { free: false },
  premovable: { enabled: true },
  drawable: { enabled: true, eraseOnClick: true },
};
