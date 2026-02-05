import { createGame, makeMove, type GameState } from "./tic-tac-toe";
import express from "express";
import ViteExpress from "vite-express";

export const app = express();

app.use(express.json());

const games = new Map<string, GameState>();

app.post("/games", (_req, res) => {
  const gameId = crypto.randomUUID();
  const newGame = createGame();
  games.set(gameId, newGame);
  res.json({ ...newGame, id: gameId });
});

app.get("/games", (_req, res) => {
  const gamesObject = Object.fromEntries(games);
  res.json(gamesObject);
});

app.get("/games/:id", (req, res) => {
  const id = req.params.id;
  const game = games.get(id);

  if (!game) {
    return res.status(404).json({ error: "Game not found" });
  }

  res.json({ ...game, id });
});

app.post("/games/:id/move", (req, res) => {
  const id = req.params.id;
  const { position } = req.body;
  const game = games.get(id);

  if (!game) {
    return res.status(404).json({ error: "Game not found" });
  }

  try {
    const updatedGame = makeMove(game, position);
    games.set(id, updatedGame);
    res.json({ ...updatedGame, id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    res.status(400).json({ ...game, id, error: message });
  }
});

app.post("/games/:id/reset", (req, res) => {
  const id = req.params.id;
  const existingGame = games.get(id);

  if (!existingGame) {
    return res.status(404).json({ error: "Game not found" });
  }

  const resetGame = createGame();
  games.set(id, resetGame);
  res.json({ ...resetGame, id });
});

// Only start server if this file is run directly, not when imported for tests
if (import.meta.main) {
  ViteExpress.listen(app, 3000, () => {
    console.log("Server listening at http://localhost:3000");
  });
}
