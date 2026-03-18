export const Keys = {
  game: (gameId: string) => `game_${gameId}`,
  queue: (timeControl: string) => `queue_${timeControl}`,
  timerJob: (gameId: string) => `timer_${gameId}`,
  reconnectJob: (gameId: string, userId: string) =>
    `reconnect_${gameId}_${userId}`,
  session: (userId: string) => `session_${userId}`,
  userActiveGame: (userId: string) => `user_${userId}:activeGame`,
  drawOffer: (userId: string) => `draw_offer_${userId}`,
};
