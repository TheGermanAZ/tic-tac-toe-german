import { createGame, makeMove, type GameState } from "./tic-tac-toe";
import {
  createPlayerRating,
  calculateNewRatings,
  type PlayerRating,
} from "./elo";
import { getBestMove } from "./ai";
import express from "express";
import ViteExpress from "vite-express";
import expressWs from "express-ws";
import type { WebSocket } from "ws";

const expressApp = express();
const wsInstance = expressWs(expressApp);
export const app = wsInstance.app;
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

const games = new Map<string, GameState>();
const gameConnections = new Map<string, Set<WebSocket>>();
const ratings = new Map<string, PlayerRating>();
const lobbyConnections = new Set<WebSocket>();

function getOrCreateRating(username: string): PlayerRating {
  if (!ratings.has(username)) {
    ratings.set(username, createPlayerRating(username));
  }
  return ratings.get(username)!;
}

function broadcastLeaderboard() {
  const leaderboard = [...ratings.values()].sort(
    (a, b) => b.rating - a.rating
  );
  const payload = JSON.stringify({ type: "leaderboard", ratings: leaderboard });
  for (const ws of lobbyConnections) {
    ws.send(payload);
  }
}

app.ws("/games", (ws) => {
  lobbyConnections.add(ws);

  const gamesObject = Object.fromEntries(games);
  ws.send(JSON.stringify({ type: "games_list", games: gamesObject }));

  const leaderboard = [...ratings.values()].sort(
    (a, b) => b.rating - a.rating
  );
  ws.send(JSON.stringify({ type: "leaderboard", ratings: leaderboard }));

  ws.on("message", (message: string) => {
    const data = JSON.parse(message);
    const type = data.type;

    if (type === "create") {
      const gameId = crypto.randomUUID();
      const newGame = createGame();
      games.set(gameId, newGame);
      ws.send(
        JSON.stringify({ type: "game_created", id: gameId, game: newGame })
      );
    }

    if (type === "join_game") {
      const game = games.get(data.gameId);
      if (!game) return;

      getOrCreateRating(data.username);

      const players = game.players ?? {};
      if (!players.X) {
        players.X = data.username;
      } else if (!players.O && players.X !== data.username) {
        players.O = data.username;
      }

      const updatedGame = { ...game, players };
      games.set(data.gameId, updatedGame);

      for (const connection of gameConnections.get(data.gameId) ?? []) {
        connection.send(JSON.stringify({ ...updatedGame, id: data.gameId }));
      }
    }

    if (type === "create_ai_game") {
      const gameId = crypto.randomUUID();
      const newGame: GameState = {
        ...createGame(),
        players: { X: data.username, O: "AI" },
        isAI: true,
        difficulty: data.difficulty ?? "medium",
      };
      games.set(gameId, newGame);

      getOrCreateRating(data.username);

      const payload = JSON.stringify({
        type: "game_created",
        id: gameId,
        game: newGame,
      });
      for (const conn of lobbyConnections) {
        conn.send(payload);
      }
    }

    if (type === "get_leaderboard") {
      const leaderboard = [...ratings.values()].sort(
        (a, b) => b.rating - a.rating
      );
      ws.send(JSON.stringify({ type: "leaderboard", ratings: leaderboard }));
    }
  });

  ws.on("close", () => {
    lobbyConnections.delete(ws);
  });
});

app.ws("/games/:id", (ws, req) => {
  const id = req.params.id as string;
  const game = games.get(id);

  if (!game) {
    ws.send(JSON.stringify({ error: "game not found" }));
    ws.close(1008, "game not found");
    return;
  }

  if (!gameConnections.has(id)) {
    gameConnections.set(id, new Set());
  }
  gameConnections.get(id)!.add(ws);

  ws.send(JSON.stringify({ ...game, id }));

  ws.on("message", (message: string) => {
    const data = JSON.parse(message);
    const position = data.position;
    const type = data.type;

    if (type === "move") {
      try {
        const game = games.get(id);

        if (!game) {
          ws.send(JSON.stringify({ error: "game not found" }));
          ws.close(1008, "game not found");
          return;
        }
        const updatedGame = makeMove(game, position);
        games.set(id, updatedGame);

        let ratingChange: { X?: number; O?: number } | undefined;

        if (updatedGame.winner && updatedGame.players?.X && updatedGame.players?.O) {
          const xPlayer = getOrCreateRating(updatedGame.players.X);
          const oPlayer = getOrCreateRating(updatedGame.players.O);

          const xOutcome = updatedGame.winner === "X" ? "win" as const : "loss" as const;
          const result = calculateNewRatings(xPlayer, oPlayer, xOutcome);

          ratingChange = {
            X: result.player.rating - xPlayer.rating,
            O: result.opponent.rating - oPlayer.rating,
          };

          ratings.set(updatedGame.players.X, result.player);
          ratings.set(updatedGame.players.O, result.opponent);

          broadcastLeaderboard();
        }

        const payload = ratingChange
          ? { ...updatedGame, id, ratingChange }
          : { ...updatedGame, id };

        for (const connection of gameConnections.get(id)!) {
          connection.send(JSON.stringify(payload));
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        ws.send(JSON.stringify({ ...game, id, error: message }));
      }
    }
    if (type === "ai_move") {
      const game = games.get(id);
      if (!game || !game.isAI) return;

      const bestPosition = getBestMove(game, game.currentPlayer, game.difficulty ?? "impossible");
      const updatedGame = makeMove(game, bestPosition);
      games.set(id, updatedGame);

      let ratingChange: { X?: number; O?: number } | undefined;

      if (updatedGame.winner && updatedGame.players?.X && updatedGame.players?.O) {
        const xPlayer = getOrCreateRating(updatedGame.players.X);
        const oPlayer = getOrCreateRating(updatedGame.players.O);

        const xOutcome = updatedGame.winner === "X" ? "win" as const : "loss" as const;
        const result = calculateNewRatings(xPlayer, oPlayer, xOutcome);

        ratingChange = {
          X: result.player.rating - xPlayer.rating,
          O: result.opponent.rating - oPlayer.rating,
        };

        ratings.set(updatedGame.players.X, result.player);
        ratings.set(updatedGame.players.O, result.opponent);

        broadcastLeaderboard();
      }

      const payload = ratingChange
        ? { ...updatedGame, id, ratingChange }
        : { ...updatedGame, id };

      for (const connection of gameConnections.get(id)!) {
        connection.send(JSON.stringify(payload));
      }
    }

    if (type === "reset") {
      const game = games.get(id);
      const resetGame = { ...createGame(), players: game?.players, isAI: game?.isAI, difficulty: game?.difficulty };
      games.set(id, resetGame);
      for (const connection of gameConnections.get(id)!) {
        connection.send(JSON.stringify({ ...resetGame, id }));
      }
    }
  });

  ws.on("close", () => {
    const connections = gameConnections.get(id);
    if (connections) {
      connections.delete(ws);
      if (connections.size === 0) {
        gameConnections.delete(id);
      }
    }
  });
});

// Only start server if this file is run directly, not when imported for tests
if (import.meta.main) {
  ViteExpress.listen(app as unknown as express.Express, port, () => {
    console.log("Server listening at http://localhost:3000");
  });
}
