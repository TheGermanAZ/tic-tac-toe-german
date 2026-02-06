import { createGame, makeMove, type GameState } from "./tic-tac-toe";
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
        for (const connection of gameConnections.get(id)!) {
          connection.send(JSON.stringify({ ...updatedGame, id }));
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        ws.send(JSON.stringify({ ...game, id, error: message }));
      }
    }
    if (type === "reset") {
      const resetGame = createGame();
      games.set(id, resetGame);
      ws.send(JSON.stringify({ ...resetGame, id }));
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
