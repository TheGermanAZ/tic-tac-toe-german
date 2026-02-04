import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import {
  callToEmoji,
  createGame,
  getWinner,
  makeMove,
  type Player,
} from "./tic-tac-toe";

function App() {
  const [gameState, setGameState] = useState(getInitialGame());
  const previousWinnerRef = useRef<Player>(null);

  useEffect(() => {
    const winner = getWinner(gameState);
    // Trigger confetti when a winner appears (was null, now has a winner)
    if (winner && previousWinnerRef.current === null) {
      // Confetti explosion from center
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
    previousWinnerRef.current = winner;
  }, [gameState]);

  // TODO: display the gameState, and call `makeMove` when a player clicks a button
  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <div>Tic Tac Toe</div>
      <div>current player: {callToEmoji(gameState.currentPlayer)}</div>
      {getWinner(gameState) && (
        <div>winner: {callToEmoji(getWinner(gameState))}</div>
      )}
      <div className="w-[200px] flex flex-col gap-1">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex gap-1">
            {[0, 1, 2].map((col) => (
              <button
                key={col}
                className="flex-1 aspect-square text-3xl border border-gray-300 bg-white hover:bg-gray-50 hover:scale-105 hover:animate-[spin_10s_linear_infinite] active:scale-95 transition-all duration-200 "
                onClick={() => setGameState(makeMove(gameState, row * 3 + col))}
              >
                {callToEmoji(gameState.board[row * 3 + col])}
              </button>
            ))}
          </div>
        ))}
      </div>
      <button
        className="mt-2 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all duration-200"
        onClick={() => setGameState(getInitialGame())}
      >
        new game
      </button>
    </div>
  );
}

function getInitialGame() {
  return createGame();
}

export default App;
