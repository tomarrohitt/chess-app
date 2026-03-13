export enum WsMessageType {
  JOIN_QUEUE = "JOIN_QUEUE",
  LEAVE_QUEUE = "LEAVE_QUEUE",
  QUEUE_JOINED = "QUEUE_JOINED",
  QUEUE_LEFT = "QUEUE_LEFT",
  MAKE_MOVE = "MAKE_MOVE",
  MOVE_MADE = "MOVE_MADE",
  MOVE_ACCEPTED = "MOVE_ACCEPTED",
  MOVE_REJECTED = "MOVE_REJECTED",
  MATCHMAKING_TIMEOUT = "MATCHMAKING_TIMEOUT",
  GAME_STARTED = "GAME_STARTED",
  GAME_ENDED = "GAME_ENDED",
  GAME_OVER = "GAME_OVER",
  OFFER_DRAW = "OFFER_DRAW",
  ACCEPT_DRAW = "ACCEPT_DRAW",
  DECLINE_DRAW = "DECLINE_DRAW",
  DRAW_OFFERED = "DRAW_OFFERED",
  DRAW_DECLINED = "DRAW_DECLINED",
  GAME_ABORTED = "GAME_ABORTED",
  RESIGN_GAME = "RESIGN_GAME",
  SYNC_GAME = "SYNC_GAME",
  GAME_STATE = "GAME_STATE",
  ERROR = "ERROR",
}

export enum GameStatus {
  IN_PROGRESS = "IN_PROGRESS",
  CHECKMATE = "CHECKMATE",
  RESIGN = "RESIGN",
  DRAW = "DRAW",
  AGREEMENT = "AGREEMENT",
  STALEMATE = "STALEMATE",
  INSUFFICIENT_MATERIAL = "INSUFFICIENT_MATERIAL",
  FIFTY_MOVE_RULE = "FIFTY_MOVE_RULE",
  THREEFOLD_REPETITION = "THREEFOLD_REPETITION",
  TIME_OUT = "TIME_OUT",
  ABANDONED = "ABANDONED",
}

export type WsConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"

export type QueueStatus =
  | "idle"
  | "waiting"

export type PlayerColor = "w" | "b"

export interface ActiveGame {
  gameId: string
  fen: string
  pgn: string
  turn: PlayerColor
  playerColor: PlayerColor
  whiteId: string
  blackId: string
  timeControl: string
  whiteTimeMs: number
  blackTimeMs: number
  status: GameStatus
}

export interface GameStartedPayload {
  gameId: string
  fen: string
  timeControl: string
  playerColor: PlayerColor
  players: {
    white: string
    black: string
  }
}

export interface GameStatePayload {
  gameId: string
  fen: string
  pgn?: string
  turn: PlayerColor
  playerColor: PlayerColor
  whiteId: string
  blackId: string
  timeControl: string
  whiteTimeLeftMs: number
  blackTimeLeftMs: number
}

export interface MoveMadePayload {
  gameId: string
  fen: string
  pgn: string
  move: string
  turn: PlayerColor
  whiteTimeMs: number
  blackTimeMs: number
  isGameOver: boolean
}

export interface GameOverState {
  status: GameStatus
  winnerId?: string
  reason?: string
}

export interface DrawOfferState {
  gameId: string
  offeredBy: string
}

export type ServerMessage =
  | { type: "GAME_STARTED"; payload: GameStartedPayload }
  | { type: "GAME_STATE"; payload: GameStatePayload }
  | { type: "MOVE_MADE"; payload: MoveMadePayload }
  | { type: "MOVE_REJECTED"; payload: { reason: string } }
  | { type: "GAME_OVER"; payload: GameOverState }

export enum GameResult {
  d = "d",
  w = "w",
  b = "b",
}
