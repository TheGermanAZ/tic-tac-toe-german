import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";

import { type GameState, type Player } from "./server/tic-tac-toe";

function GameBoard({ id }: { id: string }) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const previousWinnerRef = useRef<Player>(null);
  const wsRef = useRef<WebSocket>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${protocol}://${window.location.host}/games/${id}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.error) {
        console.error("Server error:", data.error);
        return;
      }

      setGameState(data);
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
  }, [id]);

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
    wsRef.current?.send(JSON.stringify({ type: "reset" }));
  };

  const moveHandler = async (position: number) => {
    wsRef.current?.send(JSON.stringify({ type: "move", position }));
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
        reset game
      </button>
    </div>
  );
}

export default GameBoard;
