import { describe, expect, it } from "vitest";
import { app } from ".";
import request from "supertest";

describe("GET /games", () => {
  it("returns an empty object when no games exist", async () => {
    const res = await request(app).get("/games");
    expect(res.status).toBe(200);
    expect(typeof res.body).toBe("object");
    expect(res.body).not.toBeNull();
    expect(Array.isArray(res.body)).toBe(false);
    expect(Object.keys(res.body).length).toBe(0);
  });

  it("returns all created games as a map", async () => {
    const game1 = await request(app).post("/games");
    const game2 = await request(app).post("/games");

    const res = await request(app).get("/games");
    expect(res.status).toBe(200);
    expect(typeof res.body).toBe("object");
    expect(Array.isArray(res.body)).toBe(false);
    expect(Object.keys(res.body).length).toBeGreaterThanOrEqual(2);

    expect(res.body[game1.body.id]).toBeDefined();
    expect(res.body[game2.body.id]).toBeDefined();
  });

  it("each game in map has required fields", async () => {
    const createRes = await request(app).post("/games");
    const gameId = createRes.body.id;
    const res = await request(app).get("/games");

    expect(Object.keys(res.body).length).toBeGreaterThan(0);
    const game = res.body[gameId];
    expect(game).toBeDefined();
    expect(game).toHaveProperty("board");
    expect(game).toHaveProperty("currentPlayer");
    expect(Array.isArray(game.board)).toBe(true);
    expect(game.board.length).toBe(9);
  });
});

describe("POST /games", () => {
  it("creates a new game with a UUID", async () => {
    const res = await request(app).post("/games");
    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
    expect(typeof res.body.id).toBe("string");
    expect(res.body.id.length).toBeGreaterThan(0);
  });

  it("creates games with different IDs", async () => {
    const res1 = await request(app).post("/games");
    const res2 = await request(app).post("/games");

    expect(res1.body.id).toBeDefined();
    expect(res2.body.id).toBeDefined();
    expect(res1.body.id).not.toBe(res2.body.id);
  });

  it("creates a game with correct initial state", async () => {
    const res = await request(app).post("/games");
    expect(res.status).toBe(200);
    expect(res.body.board).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
    expect(res.body.currentPlayer).toBe("X");
    expect(res.body.winner).toBeUndefined();
  });

  it("created game appears in GET /games map", async () => {
    const createRes = await request(app).post("/games");
    const gameId = createRes.body.id;

    const listRes = await request(app).get("/games");
    expect(listRes.status).toBe(200);
    expect(typeof listRes.body).toBe("object");
    expect(listRes.body).not.toBeNull();
    expect(Array.isArray(listRes.body)).toBe(false);

    expect(listRes.body[gameId]).toBeDefined();
    expect(listRes.body[gameId].board).toEqual(createRes.body.board);
  });
});

describe("GET /games/:id", () => {
  it("returns the correct game for valid ID", async () => {
    const createRes = await request(app).post("/games");
    const gameId = createRes.body.id;

    const getRes = await request(app).get(`/games/${gameId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.id).toBe(gameId);
    expect(getRes.body.board).toEqual(createRes.body.board);
    expect(getRes.body.currentPlayer).toBe(createRes.body.currentPlayer);
  });

  it("returns 404 for non-existent game ID", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const res = await request(app).get(`/games/${fakeId}`);
    expect(res.status).toBe(404);
  });

  it("returns game with correct state", async () => {
    const createRes = await request(app).post("/games");
    const gameId = createRes.body.id;

    const getRes = await request(app).get(`/games/${gameId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.id).toBe(gameId);
    expect(getRes.body).toHaveProperty("board");
    expect(getRes.body).toHaveProperty("currentPlayer");
    expect(getRes.body.currentPlayer).toBe("X");
  });
});

describe("POST /games/:id/move", () => {
  it("makes a move on the specified game", async () => {
    const createRes = await request(app).post("/games");
    const gameId = createRes.body.id;

    const moveRes = await request(app)
      .post(`/games/${gameId}/move`)
      .send({ position: 0 });

    expect(moveRes.status).toBe(200);
    expect(moveRes.body.id).toBe(gameId);
    expect(moveRes.body.board[0]).toBe("X");
    expect(moveRes.body.currentPlayer).toBe("O");
  });

  it("returns 404 for non-existent game ID", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const res = await request(app)
      .post(`/games/${fakeId}/move`)
      .send({ position: 0 });
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid position", async () => {
    const createRes = await request(app).post("/games");
    const gameId = createRes.body.id;

    const res = await request(app)
      .post(`/games/${gameId}/move`)
      .send({ position: 9 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.id).toBe(gameId);
  });

  it("returns 400 for occupied cell", async () => {
    const createRes = await request(app).post("/games");
    const gameId = createRes.body.id;

    await request(app).post(`/games/${gameId}/move`).send({ position: 0 });

    const res = await request(app)
      .post(`/games/${gameId}/move`)
      .send({ position: 0 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.id).toBe(gameId);
  });

  it("returns 400 when game is already over", async () => {
    const createRes = await request(app).post("/games");
    const gameId = createRes.body.id;

    // Win the game: X at 0,1,2
    await request(app).post(`/games/${gameId}/move`).send({ position: 0 });
    await request(app).post(`/games/${gameId}/move`).send({ position: 3 });
    await request(app).post(`/games/${gameId}/move`).send({ position: 1 });
    await request(app).post(`/games/${gameId}/move`).send({ position: 4 });
    await request(app).post(`/games/${gameId}/move`).send({ position: 2 });

    const res = await request(app)
      .post(`/games/${gameId}/move`)
      .send({ position: 5 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.id).toBe(gameId);
  });

  it("requires position in request body", async () => {
    const createRes = await request(app).post("/games");
    const gameId = createRes.body.id;

    const res = await request(app).post(`/games/${gameId}/move`).send({});
    expect(res.status).toBe(400);
  });
});

describe("POST /games/:id/reset", () => {
  it("resets the specified game", async () => {
    const createRes = await request(app).post("/games");
    const gameId = createRes.body.id;

    // Make some moves
    await request(app).post(`/games/${gameId}/move`).send({ position: 0 });
    await request(app).post(`/games/${gameId}/move`).send({ position: 1 });

    // Reset the game
    const resetRes = await request(app).post(`/games/${gameId}/reset`);
    expect(resetRes.status).toBe(200);
    expect(resetRes.body.id).toBe(gameId);
    expect(resetRes.body.board).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
    expect(resetRes.body.currentPlayer).toBe("X");
  });

  it("returns 404 for non-existent game ID", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const res = await request(app).post(`/games/${fakeId}/reset`);
    expect(res.status).toBe(404);
  });
});

describe("Game isolation", () => {
  it("moves on different games don't affect each other", async () => {
    const game1Res = await request(app).post("/games");
    const game2Res = await request(app).post("/games");
    const game1Id = game1Res.body.id;
    const game2Id = game2Res.body.id;

    // Make move on game 1
    await request(app).post(`/games/${game1Id}/move`).send({ position: 0 });

    // Verify game 1 changed
    const getGame1 = await request(app).get(`/games/${game1Id}`);
    expect(getGame1.body.board[0]).toBe("X");

    // Verify game 2 unchanged
    const getGame2 = await request(app).get(`/games/${game2Id}`);
    expect(getGame2.body.board[0]).toBeNull();
  });

  it("resetting one game doesn't affect others", async () => {
    const game1Res = await request(app).post("/games");
    const game2Res = await request(app).post("/games");
    const game1Id = game1Res.body.id;
    const game2Id = game2Res.body.id;

    // Make moves on both games
    await request(app).post(`/games/${game1Id}/move`).send({ position: 0 });
    await request(app).post(`/games/${game2Id}/move`).send({ position: 4 });

    // Reset game 1
    await request(app).post(`/games/${game1Id}/reset`);

    // Verify game 1 is reset
    const getGame1 = await request(app).get(`/games/${game1Id}`);
    expect(getGame1.body.board[0]).toBeNull();

    // Verify game 2 unchanged
    const getGame2 = await request(app).get(`/games/${game2Id}`);
    expect(getGame2.body.board[4]).toBe("X");
  });

  it("multiple games can have different winners", async () => {
    const game1Res = await request(app).post("/games");
    const game2Res = await request(app).post("/games");
    const game1Id = game1Res.body.id;
    const game2Id = game2Res.body.id;

    // X wins game 1 (top row)
    await request(app).post(`/games/${game1Id}/move`).send({ position: 0 });
    await request(app).post(`/games/${game1Id}/move`).send({ position: 3 });
    await request(app).post(`/games/${game1Id}/move`).send({ position: 1 });
    await request(app).post(`/games/${game1Id}/move`).send({ position: 4 });
    await request(app).post(`/games/${game1Id}/move`).send({ position: 2 });

    // O wins game 2 (middle column: positions 1, 4, 7)
    // X at 0, O at 1, X at 2, O at 4, X at 3, O at 7
    await request(app).post(`/games/${game2Id}/move`).send({ position: 0 }); // X
    await request(app).post(`/games/${game2Id}/move`).send({ position: 1 }); // O
    await request(app).post(`/games/${game2Id}/move`).send({ position: 2 }); // X
    await request(app).post(`/games/${game2Id}/move`).send({ position: 4 }); // O
    await request(app).post(`/games/${game2Id}/move`).send({ position: 3 }); // X
    await request(app).post(`/games/${game2Id}/move`).send({ position: 7 }); // O wins!

    const getGame1 = await request(app).get(`/games/${game1Id}`);
    const getGame2 = await request(app).get(`/games/${game2Id}`);

    expect(getGame1.body.winner).toBe("X");
    expect(getGame2.body.winner).toBe("O");
  });
});
