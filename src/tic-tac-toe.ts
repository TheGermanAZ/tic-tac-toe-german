export type Player = "X" | "O";

export type Cell = Player | null;

// Board is a 3x3 grid, represented as a 9-element array.
// Indices map to positions:
//  0 | 1 | 2
//  ---------
//  3 | 4 | 5
//  ---------
//  6 | 7 | 8
export type Board = [Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell];

export type GameState = {
  board: Board;
  currentPlayer: Player;
};

export function createGame(): GameState {
  return {
    board: [null, null, null, null, null, null, null, null, null],
    currentPlayer: "X",
  };
}

export function makeMove(state: GameState, position: number): GameState {
  if (!Number.isInteger(position)) {
    throw new Error("Position must be an integer");
  }
  if (position < 0 || position > 8) {
    throw new Error("Position must be between 0 and 8");
  }
  if (state.board[position] !== null) {
    throw new Error("Position is already occupied");
  }
  const winner = getWinner(state);
  if (winner !== null) {
    throw new Error("Game is already over");
  }

  const newState: GameState = { ...state, board: [...state.board] };
  newState.board[position] = state.currentPlayer;

  if (state.currentPlayer === "X") {
    newState.currentPlayer = "O";
  } else {
    newState.currentPlayer = "X";
  }
  return newState;
}

export function getWinner(state: GameState): Player | null {
  if (
    state.board[0] === state.board[1] &&
    state.board[1] === state.board[2] &&
    state.board[0] !== null
  ) {
    return state.board[0];
  }
  if (
    state.board[3] === state.board[4] &&
    state.board[4] === state.board[5] &&
    state.board[3] !== null
  ) {
    return state.board[3];
  }
  if (
    state.board[6] === state.board[7] &&
    state.board[7] === state.board[8] &&
    state.board[6] !== null
  ) {
    return state.board[6];
  }
  if (
    state.board[0] === state.board[3] &&
    state.board[3] === state.board[6] &&
    state.board[0] !== null
  ) {
    return state.board[0];
  }
  if (
    state.board[1] === state.board[4] &&
    state.board[4] === state.board[7] &&
    state.board[1] !== null
  ) {
    return state.board[1];
  }
  if (
    state.board[2] === state.board[5] &&
    state.board[5] === state.board[8] &&
    state.board[2] !== null
  ) {
    return state.board[2];
  }
  if (
    state.board[0] === state.board[4] &&
    state.board[4] === state.board[8] &&
    state.board[0] !== null
  ) {
    return state.board[0];
  }
  if (
    state.board[2] === state.board[4] &&
    state.board[4] === state.board[6] &&
    state.board[2] !== null
  ) {
    return state.board[2];
  }
  return null;
}

const WINNING_LINES: [number, number, number][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function altWinner(state: GameState): Player | null {
  for (const [a, b, c] of WINNING_LINES) {
    const cell = state.board[a];
    if (cell !== null && cell === state.board[b] && cell === state.board[c]) {
      return cell;
    }
  }
  return null;
}
