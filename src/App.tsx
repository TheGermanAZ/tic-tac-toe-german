import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";

import { type GameState, type Player } from "./server/tic-tac-toe";

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const previousWinnerRef = useRef<Player>(null);

  useEffect(() => {
    const getGameState = async () => {
      try {
        const response = await fetch("/game");

        const data = await response.json();

        if (!response.ok) {
          console.error("error fetching game state", data.error);
        }

        setGameState(data);
      } catch (error) {
        console.error("couldnt get the game state", { cause: error });
      }
    };
    getGameState();
  }, []);

  useEffect(() => {
    const winner = gameState?.winner;
    // Trigger confetti when a winner appears (was null, now has a winner)
    if (winner && previousWinnerRef.current === null) {
      // Confetti explosion from center
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
    previousWinnerRef.current = winner ?? null;
  }, [gameState]);

  if (gameState === null) return <div>loading</div>;

  const resetHandler = async () => {
    try {
      const response = await fetch("/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("error fetching reset method");
      }

      setGameState(data);
    } catch (error) {
      console.error("couldnt reset game", { cause: error });
    }
  };

  const moveHandler = async (position: number) => {
    try {
      const response = await fetch("/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Move failed:", data.error);
        return;
      }

      setGameState(data);
    } catch (error) {
      console.error("couldnt change game state", { cause: error });
    }
  };

  // TODO: display the gameState, and call `makeMove` when a player clicks a button
  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <div>Tic Tac Toe</div>
      <div>current player: {gameState.currentPlayer}</div>
      {gameState.winner && <div>winner: {gameState.winner}</div>}
      <div className="w-[200px] flex flex-col gap-1">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex gap-1">
            {[0, 1, 2].map((col) => (
              <button
                key={col}
                className="flex-1 aspect-square text-3xl border border-gray-300 bg-white hover:bg-gray-50 hover:scale-105 hover:animate-[spin_10s_linear_infinite] active:scale-95 transition-all duration-200 "
                onClick={() => moveHandler(row * 3 + col)}
              >
                {gameState.board[row * 3 + col]}
              </button>
            ))}
          </div>
        ))}
      </div>
      <button
        className="mt-2 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all duration-200"
        onClick={() => resetHandler()}
      >
        new game
      </button>
    </div>
  );
}

export default App;
