export type PlayerRating = {
  username: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
};

export type Outcome = "win" | "loss" | "draw";

const K = 32;
const DEFAULT_RATING = 1000;

export function createPlayerRating(username: string): PlayerRating {
  return {
    username,
    rating: DEFAULT_RATING,
    wins: 0,
    losses: 0,
    draws: 0,
  };
}

/**
 * Calculate the expected score for a player given both ratings.
 * Returns a number between 0 and 1 representing the probability of winning.
 * Formula: 1 / (1 + 10^((opponentRating - playerRating) / 400))
 */
export function calculateExpected(
  playerRating: number,
  opponentRating: number
): number {
  return 1 / (1 + 10 ** ((opponentRating - playerRating) / 400));
}

/**
 * Calculate new ratings for both players after a game.
 * Returns updated copies of both player ratings (does not mutate originals).
 */
export function calculateNewRatings(
  player: PlayerRating,
  opponent: PlayerRating,
  outcome: Outcome
): { player: PlayerRating; opponent: PlayerRating } {
  const actualScore = outcome === "win" ? 1 : outcome === "loss" ? 0 : 0.5;
  const opponentActualScore = 1 - actualScore;

  const playerExpected = calculateExpected(player.rating, opponent.rating);
  const opponentExpected = calculateExpected(opponent.rating, player.rating);

  const playerNewRating = Math.round(
    player.rating + K * (actualScore - playerExpected)
  );
  const opponentNewRating = Math.round(
    opponent.rating + K * (opponentActualScore - opponentExpected)
  );

  return {
    player: {
      ...player,
      rating: playerNewRating,
      wins: player.wins + (outcome === "win" ? 1 : 0),
      losses: player.losses + (outcome === "loss" ? 1 : 0),
      draws: player.draws + (outcome === "draw" ? 1 : 0),
    },
    opponent: {
      ...opponent,
      rating: opponentNewRating,
      wins: opponent.wins + (outcome === "loss" ? 1 : 0),
      losses: opponent.losses + (outcome === "win" ? 1 : 0),
      draws: opponent.draws + (outcome === "draw" ? 1 : 0),
    },
  };
}
