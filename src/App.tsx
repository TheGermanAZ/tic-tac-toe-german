import { useEffect, useRef, useState } from "react";
import type { GameState } from "./server/tic-tac-toe";
import GameBoard from "./GameBoard";

function App() {
  const [games, setGames] = useState<Record<string, GameState>>({});
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
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

  const setGameId = (id: string) => {
    setSelectedGameId(id);
  };

  if (selectedGameId === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <h1 className="text-2xl font-bold">Tic Tac Toe Games</h1>
        <button
          onClick={() => addGameHandler()}
          className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all duration-200 rounded"
        >
          Create New Game
        </button>
        <div className="flex flex-col gap-4 w-full max-w-2xl">
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
                  onClick={() => setGameId(id)}
                  className="absolute inset-0 cursor-pointer z-10"
                />
                <div className="pointer-events-none">
                  <GameBoard id={id} />
                </div>
              </div>
            ))
          )}
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
