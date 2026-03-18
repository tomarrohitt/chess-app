export class DomainError extends Error {
  constructor(
    public readonly userMessage: string,
    internalMessage?: string,
  ) {
    super(internalMessage ?? userMessage);
    this.name = "DomainError";
  }
}

export class GameNotFoundError extends DomainError {
  constructor(gameId: string) {
    super(
      "Game not found",
      `Game not found or corrupted state for gameId: ${gameId}`,
    );
    this.name = "GameNotFoundError";
  }
}

export class NotYourTurnError extends DomainError {
  constructor() {
    super("Not your turn");
    this.name = "NotYourTurnError";
  }
}

export class TimeExpiredError extends DomainError {
  constructor() {
    super("Time expired");
    this.name = "TimeExpiredError";
  }
}

export class IllegalMoveError extends DomainError {
  constructor() {
    super("Illegal move");
    this.name = "IllegalMoveError";
  }
}

export class AuthError extends DomainError {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}
