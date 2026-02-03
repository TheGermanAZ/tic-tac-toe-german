import { useState } from "react";
import { createGame, getWinner, makeMove } from "./tic-tac-toe";

function App() {
  const [gameState, setGameState] = useState(getInitialGame());

  // TODO: display the gameState, and call `makeMove` when a player clicks a button
  return (
    <>
      <div>current player: {gameState.currentPlayer}</div>
      {getWinner(gameState) && <div>winner: {getWinner(gameState)}</div>}
      <div>
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            style={{ display: "flex", gap: 4, justifyContent: "center" }}
          >
            {[0, 1, 2].map((col) => (
              <button
                key={col}
                style={{ flex: 0.1, aspectRatio: "1" }}
                onClick={() => setGameState(makeMove(gameState, row * 3 + col))}
              >
                {gameState.board[row * 3 + col]}
              </button>
            ))}
          </div>
        ))}
      </div>
      <button onClick={() => setGameState(getInitialGame())}>reset game</button>
    </>
  );
}

function getInitialGame() {
  return createGame();
}

export default App;
