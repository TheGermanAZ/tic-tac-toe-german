import { createGame, makeMove, type GameState } from "./tic-tac-toe";
import express from "express";
import ViteExpress from "vite-express";

const app = express();

app.use(express.json());

let game: GameState = createGame();

app.get("/game", (_, res) => {
  res.json(game);
});

app.post("/move", (req, res) => {
  const { position } = req.body;
  game = makeMove(game, position);
  res.json(game);
});

app.post("/reset", (_, res) => {
  game = createGame();
  res.json(game);
});

ViteExpress.listen(app, 3000, () => {
  console.log("Server listening at http://localhost:3000");
});
