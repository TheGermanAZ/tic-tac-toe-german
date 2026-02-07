import {
  type GameState,
  type Difficulty,
  type Player,
  makeMove,
  getWinner,
  isBoardFull,
} from "./tic-tac-toe";

const MISTAKE_RATE: Record<Difficulty, number> = {
  easy: 0.5,
  medium: 0.3,
  hard: 0.15,
  expert: 0.05,
  impossible: 0,
};

/**
 * Minimax algorithm: recursively scores every possible game outcome.
 *
 * Returns +1 if aiPlayer wins, -1 if opponent wins, 0 for draw.
 * On the AI's turn (isMaximizing=true), picks the highest score.
 * On the opponent's turn (isMaximizing=false), picks the lowest score.
 */
function minimax(
  state: GameState,
  isMaximizing: boolean,
  aiPlayer: Player
): number {
  const winner = getWinner(state);
  if (winner === aiPlayer) return 1;
  if (winner !== null) return -1;
  if (isBoardFull(state)) return 0;

  let bestScore = isMaximizing ? -Infinity : Infinity;

  for (let i = 0; i < 9; i++) {
    if (state.board[i] !== null) continue;

    const nextState = makeMove(state, i);
    const score = minimax(nextState, !isMaximizing, aiPlayer);

    bestScore = isMaximizing
      ? Math.max(bestScore, score)
      : Math.min(bestScore, score);
  }

  return bestScore;
}

/**
 * Returns the best position (0-8) for the AI to play.
 * On easy/medium, the AI occasionally picks a random empty cell
 * instead of the optimal move, giving the human a chance to win.
 */
export function getBestMove(
  state: GameState,
  aiPlayer: Player,
  difficulty: Difficulty = "impossible"
): number {
  const emptyCells = state.board
    .map((cell, i) => (cell === null ? i : -1))
    .filter((i) => i !== -1);

  if (Math.random() < MISTAKE_RATE[difficulty]) {
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  let bestScore = -Infinity;
  let bestPosition = -1;

  for (const i of emptyCells) {
    const nextState = makeMove(state, i);
    const score = minimax(nextState, false, aiPlayer);

    if (score > bestScore) {
      bestScore = score;
      bestPosition = i;
    }
  }

  return bestPosition;
}
