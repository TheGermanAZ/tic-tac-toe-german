import { useEffect, useState } from "react";
import type { GameState } from "./server/tic-tac-toe";
import GameBoard from "./GameBoard";

function App() {
  const [games, setGames] = useState<Record<string, GameState>>({});
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  useEffect(() => {
    const getGames = async () => {
      const response = await fetch("/games");

      const data = await response.json();

      if (!response.ok) {
        console.error("could not fetch initial game data");
      }
      setGames(data);
    };

    getGames();
  }, []);

  const addGameHandler = async () => {
    const response = await fetch("/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("could not create new game");
    }

    const { id, ...gameState } = data;

    setGames({ ...games, [id]: gameState });
  };

  const setGameId = (id: string) => {
    setSelectedGameId(id);
  };

  if (selectedGameId === null) {
    return (
      <>
        <button
          onClick={() => addGameHandler()}
          className="flex flex-col items-center justify-center gap-1"
        >
          create game
        </button>
        {Object.keys(games).map((id) => {
          return (
            <button key={id} onClick={() => setGameId(id)}>
              <GameBoard id={id} />
            </button>
          );
        })}
      </>
    );
  } else {
    return (
      <>
        <button onClick={() => setSelectedGameId(null)}>Back to games</button>
        <GameBoard id={selectedGameId} />
      </>
    );
  }
}
export default App;
