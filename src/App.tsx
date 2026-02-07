import { useEffect, useRef, useState } from "react";
import type { GameState, Difficulty } from "./server/tic-tac-toe";
import type { PlayerRating } from "./server/elo";
import GameBoard from "./GameBoard";

function App() {
  const [games, setGames] = useState<Record<string, GameState>>({});
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [leaderboard, setLeaderboard] = useState<PlayerRating[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const wsRef = useRef<WebSocket>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${protocol}://${window.location.host}/games`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.error) {
        console.error("Server error:", data.error);
        return;
      }

      if (data.type === "games_list") {
        setGames(data.games);
      }

      if (data.type === "game_created") {
        setGames((prev) => ({ ...prev, [data.id]: data.game }));
        if (data.game.isAI) {
          setSelectedGameId(data.id);
        }
      }

      if (data.type === "leaderboard") {
        setLeaderboard(data.ratings);
      }
    };

    ws.onerror = (error) => {
      if (ws.readyState === WebSocket.OPEN) {
        console.error("Websocket error:", error);
      }
    };

    ws.onclose = (event) => {
      console.log("WebSocket closed:", event.code, event.reason);
    };

    return () => {
      ws.close();
    };
  }, []);

  const addGameHandler = () => {
    wsRef.current?.send(JSON.stringify({ type: "create" }));
  };

  const addAIGameHandler = () => {
    wsRef.current?.send(
      JSON.stringify({ type: "create_ai_game", username, difficulty })
    );
  };

  const joinGame = (gameId: string) => {
    if (!username) return;
    wsRef.current?.send(
      JSON.stringify({ type: "join_game", gameId, username })
    );
    setSelectedGameId(gameId);
  };

  if (username === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <h1 className="text-2xl font-bold">Tic Tac Toe</h1>
        <p className="text-gray-500">Enter your username to play</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (usernameInput.trim()) {
              setUsername(usernameInput.trim());
            }
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            placeholder="Username"
            className="px-4 py-2 border border-gray-300 rounded"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all duration-200 rounded"
          >
            Play
          </button>
        </form>
      </div>
    );
  }

  if (selectedGameId === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <h1 className="text-2xl font-bold">Tic Tac Toe Games</h1>
        <p className="text-gray-500">Playing as: {username}</p>
        <div className="flex gap-2">
          <button
            onClick={() => addGameHandler()}
            className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all duration-200 rounded"
          >
            Create New Game
          </button>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="px-2 py-2 border border-gray-300 rounded bg-white"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="expert">Expert</option>
            <option value="impossible">Impossible</option>
          </select>
          <button
            onClick={() => addAIGameHandler()}
            className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all duration-200 rounded"
          >
            Play vs AI
          </button>
        </div>

        <div className="flex gap-8 w-full max-w-4xl">
          <div className="flex flex-col gap-4 flex-1">
            <h2 className="text-lg font-semibold">Games</h2>
            {Object.keys(games).length === 0 ? (
              <p className="text-gray-500 text-center">
                No games yet. Create one to get started!
              </p>
            ) : (
              Object.keys(games).map((id) => (
                <div
                  key={id}
                  className="relative border border-gray-300 bg-white hover:border-gray-400 hover:shadow-md transition-all duration-200 rounded p-4"
                >
                  <div
                    onClick={() => joinGame(id)}
                    className="absolute inset-0 cursor-pointer z-10"
                  />
                  <div className="pointer-events-none">
                    <div className="text-sm text-gray-500 mb-2">
                      {games[id].players?.X ?? "waiting"} vs{" "}
                      {games[id].players?.O ?? "waiting"}
                    </div>
                    <GameBoard id={id} />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="w-64">
            <h2 className="text-lg font-semibold mb-2">Leaderboard</h2>
            {leaderboard.length === 0 ? (
              <p className="text-gray-500 text-sm">No ratings yet</p>
            ) : (
              <div className="border border-gray-300 rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2">#</th>
                      <th className="text-left px-3 py-2">Player</th>
                      <th className="text-right px-3 py-2">Rating</th>
                      <th className="text-right px-3 py-2">W/L/D</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((player, i) => (
                      <tr
                        key={player.username}
                        className={
                          player.username === username ? "bg-blue-50" : ""
                        }
                      >
                        <td className="px-3 py-1">{i + 1}</td>
                        <td className="px-3 py-1">{player.username}</td>
                        <td className="text-right px-3 py-1">
                          {player.rating}
                        </td>
                        <td className="text-right px-3 py-1">
                          {player.wins}/{player.losses}/{player.draws}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <button
          onClick={() => setSelectedGameId(null)}
          className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all duration-200 rounded self-start"
        >
          ← Back to games
        </button>
        <GameBoard id={selectedGameId} />
      </div>
    );
  }
}
export default App;
