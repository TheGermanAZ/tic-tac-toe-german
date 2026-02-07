import { describe, expect, it } from "vitest";
import {
  calculateExpected,
  calculateNewRatings,
  createPlayerRating,
} from "./elo";

describe("calculateExpected", () => {
  it("returns 0.5 for equal ratings", () => {
    expect(calculateExpected(1000, 1000)).toBe(0.5);
  });

  it("returns higher value when player rating is higher", () => {
    const expected = calculateExpected(1200, 1000);
    expect(expected).toBeGreaterThan(0.5);
    expect(expected).toBeLessThan(1);
  });

  it("returns lower value when player rating is lower", () => {
    const expected = calculateExpected(800, 1000);
    expect(expected).toBeGreaterThan(0);
    expect(expected).toBeLessThan(0.5);
  });

  it("expected scores of both players sum to 1", () => {
    const playerExpected = calculateExpected(1200, 1000);
    const opponentExpected = calculateExpected(1000, 1200);
    expect(playerExpected + opponentExpected).toBeCloseTo(1);
  });

  it("200 point advantage gives ~0.76 expected score", () => {
    const expected = calculateExpected(1200, 1000);
    expect(expected).toBeCloseTo(0.76, 1);
  });
});

describe("calculateNewRatings", () => {
  it("winner gains points and loser loses points", () => {
    const player = createPlayerRating("alice");
    const opponent = createPlayerRating("bob");
    const result = calculateNewRatings(player, opponent, "win");

    expect(result.player.rating).toBeGreaterThan(1000);
    expect(result.opponent.rating).toBeLessThan(1000);
  });

  it("rating changes are symmetric for equal-rated players", () => {
    const player = createPlayerRating("alice");
    const opponent = createPlayerRating("bob");
    const result = calculateNewRatings(player, opponent, "win");

    const playerGain = result.player.rating - 1000;
    const opponentLoss = 1000 - result.opponent.rating;
    expect(playerGain).toBe(opponentLoss);
  });

  it("beating a higher-rated player earns more points", () => {
    const underdog = createPlayerRating("underdog");
    const favorite = { ...createPlayerRating("favorite"), rating: 1400 };

    const upset = calculateNewRatings(underdog, favorite, "win");
    const expected = calculateNewRatings(
      createPlayerRating("a"),
      createPlayerRating("b"),
      "win"
    );

    const underdogGain = upset.player.rating - underdog.rating;
    const equalGain = expected.player.rating - 1000;
    expect(underdogGain).toBeGreaterThan(equalGain);
  });

  it("draw between equal players doesn't change ratings", () => {
    const player = createPlayerRating("alice");
    const opponent = createPlayerRating("bob");
    const result = calculateNewRatings(player, opponent, "draw");

    expect(result.player.rating).toBe(1000);
    expect(result.opponent.rating).toBe(1000);
  });

  it("draw favors the lower-rated player", () => {
    const low = createPlayerRating("low");
    const high = { ...createPlayerRating("high"), rating: 1200 };
    const result = calculateNewRatings(low, high, "draw");

    expect(result.player.rating).toBeGreaterThan(1000);
    expect(result.opponent.rating).toBeLessThan(1200);
  });

  it("tracks win/loss/draw counts", () => {
    const player = createPlayerRating("alice");
    const opponent = createPlayerRating("bob");

    const winResult = calculateNewRatings(player, opponent, "win");
    expect(winResult.player.wins).toBe(1);
    expect(winResult.opponent.losses).toBe(1);

    const drawResult = calculateNewRatings(player, opponent, "draw");
    expect(drawResult.player.draws).toBe(1);
    expect(drawResult.opponent.draws).toBe(1);
  });

  it("does not mutate original player ratings", () => {
    const player = createPlayerRating("alice");
    const opponent = createPlayerRating("bob");
    calculateNewRatings(player, opponent, "win");

    expect(player.rating).toBe(1000);
    expect(player.wins).toBe(0);
    expect(opponent.rating).toBe(1000);
    expect(opponent.losses).toBe(0);
  });
});
