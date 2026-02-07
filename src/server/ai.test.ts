import { describe, expect, it } from "vitest";
import { getBestMove } from "./ai";
import { createGame, makeMove, type GameState, type Board } from "./tic-tac-toe";

function makeBoard(board: Board, currentPlayer: "X" | "O" = "X"): GameState {
  return { board, currentPlayer };
}


describe("getBestMove", () => {
  it("returns a valid position (0-8) on empty board", () => {
    const state = createGame();
    const move = getBestMove(state, "X");
    expect(move).toBeGreaterThanOrEqual(0);
    expect(move).toBeLessThanOrEqual(8);
    expect(state.board[move]).toBeNull();
  });

  it("picks the winning move when one is available", () => {
    // O has positions 0 and 1, needs 2 to win
    const state = makeBoard(
      ["O", "O", null, "X", "X", null, null, null, null],
      "O"
    );
    const move = getBestMove(state, "O");
    expect(move).toBe(2);
  });

  it("blocks the opponent's winning move", () => {
    // X has positions 0 and 1, X needs 2 to win
    // AI is O and should block position 2
    const state = makeBoard(
      ["X", "X", null, "O", null, null, null, null, null],
      "O"
    );
    const move = getBestMove(state, "O");
    expect(move).toBe(2);
  });

  it("prefers winning over blocking", () => {
    // O can win at position 6 (column 0: positions 0, 3, 6)
    // X threatens at position 2 (row 0: positions 0, 1, 2)
    // AI (O) should take the win, not block
    const state = makeBoard(
      ["O", "X", null, "O", "X", null, null, null, null],
      "O"
    );
    const move = getBestMove(state, "O");
    expect(move).toBe(6);
  });

  it("AI never loses when playing as O (full game simulation)", () => {
    // Play all possible games where human is X and AI is O
    // AI should never lose
    function playAllGames(state: GameState): void {
      if (state.winner || state.board.every((c) => c !== null)) {
        // AI (O) should never lose
        expect(state.winner).not.toBe("X");
        return;
      }

      if (state.currentPlayer === "X") {
        // Human tries every possible move
        for (let i = 0; i < 9; i++) {
          if (state.board[i] !== null) continue;
          const nextState = makeMove(state, i);
          playAllGames(nextState);
        }
      } else {
        // AI picks its best move
        const aiMove = getBestMove(state, "O");
        const nextState = makeMove(state, aiMove);
        playAllGames(nextState);
      }
    }

    playAllGames(createGame());
  });

  it("AI never loses when playing as X (full game simulation)", () => {
    function playAllGames(state: GameState): void {
      if (state.winner || state.board.every((c) => c !== null)) {
        expect(state.winner).not.toBe("O");
        return;
      }

      if (state.currentPlayer === "X") {
        // AI picks its best move
        const aiMove = getBestMove(state, "X");
        const nextState = makeMove(state, aiMove);
        playAllGames(nextState);
      } else {
        // Opponent tries every possible move
        for (let i = 0; i < 9; i++) {
          if (state.board[i] !== null) continue;
          const nextState = makeMove(state, i);
          playAllGames(nextState);
        }
      }
    }

    playAllGames(createGame());
  });

  it("easy difficulty always returns a valid empty cell", () => {
    const state = makeBoard(
      ["X", null, "O", null, "X", null, "O", null, null],
      "O"
    );
    for (let i = 0; i < 20; i++) {
      const move = getBestMove(state, "O", "easy");
      expect(move).toBeGreaterThanOrEqual(0);
      expect(move).toBeLessThanOrEqual(8);
      expect(state.board[move]).toBeNull();
    }
  });

  it("picks the only remaining empty cell", () => {
    // Only position 8 is empty
    const state = makeBoard(
      ["X", "O", "X", "O", "X", "O", "O", "X", null],
      "X"
    );
    const move = getBestMove(state, "X");
    expect(move).toBe(8);
  });
});
