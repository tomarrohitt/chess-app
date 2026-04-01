import { GameStatus } from "./chess";

export type Player = {
  id: string;
  username: string;
  currentRating: number;
  matchRating: number;
  diff: number;
};

export type GameRecord = {
  id: string;
  status: GameStatus;
  timeControl: string;
  createdAt: string;
  winnerId: string | null;
  result: string;
  finalFen: string;
  pgn: string;
  moveTimes: number[];
  white: Player;
  black: Player;
};
