import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";

import { type GameState, type Player } from "./server/tic-tac-toe";

type GameMessage = GameState & {
  id: string;
  ratingChange?: { X?: number; O?: number };
};

function GameBoard({ id }: { id: string }) {
  const [gameState, setGameState] = useState<GameMessage | null>(null);
  const previousWinnerRef = useRef<Player | undefined | null>(undefined);
  const wsRef = useRef<WebSocket>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(
      `${protocol}://${window.location.host}/games/${id}`
    );
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
    if (gameState === null) return;

    const winner = gameState.winner;

    if (
      previousWinnerRef.current !== undefined &&
      winner &&
      previousWinnerRef.current === null
    ) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
    previousWinnerRef.current = winner ?? null;
  }, [gameState]);

  useEffect(() => {
    return () => confetti.reset();
  }, []);

  useEffect(() => {
    if (!gameState) return;
    if (!gameState.isAI) return;
    if (gameState.winner) return;
    if (gameState.board.every((c) => c !== null)) return;
    if (gameState.currentPlayer !== "O") return;

    const timer = setTimeout(() => {
      wsRef.current?.send(JSON.stringify({ type: "ai_move" }));
    }, 400);

    return () => clearTimeout(timer);
  }, [gameState]);

  if (gameState === null) return <div>loading</div>;

  const resetHandler = () => {
    wsRef.current?.send(JSON.stringify({ type: "reset" }));
  };

  const moveHandler = (position: number) => {
    wsRef.current?.send(JSON.stringify({ type: "move", position }));
  };

  const xPlayer = gameState.players?.X ?? "Player X";
  const oPlayer = gameState.players?.O ?? "Player O";

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <div className="text-lg font-semibold">
        {xPlayer} vs {oPlayer}
      </div>
      <div>current player: {gameState.currentPlayer === "X" ? xPlayer : oPlayer}</div>
      {gameState.winner && (
        <div className="flex flex-col items-center gap-1">
          <div className="font-bold">
            Winner: {gameState.winner === "X" ? xPlayer : oPlayer}
          </div>
          {gameState.ratingChange && (
            <div className="text-sm text-gray-500">
              <span className={gameState.ratingChange.X && gameState.ratingChange.X > 0 ? "text-green-600" : "text-red-600"}>
                {xPlayer}: {gameState.ratingChange.X && gameState.ratingChange.X > 0 ? "+" : ""}
                {gameState.ratingChange.X}
              </span>
              {" / "}
              <span className={gameState.ratingChange.O && gameState.ratingChange.O > 0 ? "text-green-600" : "text-red-600"}>
                {oPlayer}: {gameState.ratingChange.O && gameState.ratingChange.O > 0 ? "+" : ""}
                {gameState.ratingChange.O}
              </span>
            </div>
          )}
        </div>
      )}
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
