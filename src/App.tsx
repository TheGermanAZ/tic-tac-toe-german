import { useState } from "react";
import { callToEmoji, createGame, getWinner, makeMove } from "./tic-tac-toe";

function App() {
  const [gameState, setGameState] = useState(getInitialGame());

  // TODO: display the gameState, and call `makeMove` when a player clicks a button
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <div> Tic Tac Toe</div>
      <div>current player: {callToEmoji(gameState.currentPlayer)}</div>
      {getWinner(gameState) && (
        <div>winner: {callToEmoji(getWinner(gameState))}</div>
      )}
      <div
        style={{
          width: "200px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {[0, 1, 2].map((row) => (
          <div key={row} style={{ display: "flex", gap: 4 }}>
            {[0, 1, 2].map((col) => (
              <button
                key={col}
                style={{ flex: 1, aspectRatio: "1", fontSize: "36px" }}
                onClick={() => setGameState(makeMove(gameState, row * 3 + col))}
              >
                {callToEmoji(gameState.board[row * 3 + col])}
              </button>
            ))}
          </div>
        ))}
      </div>
      <button onClick={() => setGameState(getInitialGame())}>reset game</button>
    </div>
  );
}

function getInitialGame() {
  return createGame();
}

export default App;
