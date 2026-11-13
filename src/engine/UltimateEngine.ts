import { CellState, PlayerSymbol, UltimateBoardState, WinningLine } from '../types/game';
import { GameEngine } from './GameEngine';

export class UltimateEngine {
  /**
   * Initializes a pristine Ultimate Tic Tac Toe game state
   */
  public static createInitialState(): UltimateBoardState {
    return {
      boards: Array.from({ length: 9 }, () => Array(9).fill(null)),
      boardWins: Array(9).fill(null),
      activeBoardIndex: null, // null means initial move is Free Choice anywhere on the 9x9!
      overallWinner: null,
      winningMacroLine: null,
      miniWinningLines: Array(9).fill(null),
    };
  }

  /**
   * Validates whether a move on miniBoardIndex at cellIndex is legal
   */
  public static isValidMove(
    state: UltimateBoardState,
    boardIdx: number,
    cellIdx: number
  ): boolean {
    if (state.overallWinner !== null) return false;
    if (boardIdx < 0 || boardIdx > 8 || cellIdx < 0 || cellIdx > 8) return false;

    // If an active board is constrained, the move must occur on that board
    if (state.activeBoardIndex !== null && state.activeBoardIndex !== boardIdx) {
      return false;
    }

    // The targeted mini board must NOT be completed (won or drawn)
    if (state.boardWins[boardIdx] !== null) return false;

    // The targeted cell must be empty
    if (state.boards[boardIdx][cellIdx] !== null) return false;

    return true;
  }

  /**
   * Executes a move in Ultimate Tic Tac Toe and computes new board state and routing
   */
  public static makeMove(
    state: UltimateBoardState,
    boardIdx: number,
    cellIdx: number,
    symbol: PlayerSymbol
  ): UltimateBoardState {
    if (!this.isValidMove(state, boardIdx, cellIdx)) {
      throw new Error(`Illegal move in Ultimate TTT: board ${boardIdx}, cell ${cellIdx}`);
    }

    // Clone state
    const newBoards = state.boards.map((b) => [...b]);
    const newBoardWins = [...state.boardWins];
    const newMiniWinningLines = [...state.miniWinningLines];

    // Place symbol
    newBoards[boardIdx][cellIdx] = symbol;

    // Check if this mini board has just been won
    const { winner: miniWinner, winningLine: miniLine } = GameEngine.checkWinner(
      newBoards[boardIdx],
      3,
      3
    );

    if (miniWinner) {
      newBoardWins[boardIdx] = miniWinner;
      newMiniWinningLines[boardIdx] = miniLine?.indices || null;
    } else if (GameEngine.isBoardFull(newBoards[boardIdx])) {
      newBoardWins[boardIdx] = 'draw';
    }

    // Check macro board winner
    // Convert boardWins into a format compatible with GameEngine (only PlayerSymbol or null)
    const macroBoardCells: CellState[] = newBoardWins.map((w) =>
      w === 'draw' ? null : w
    );
    const { winner: macroWinner, winningLine: macroLine } = GameEngine.checkWinner(
      macroBoardCells,
      3,
      3
    );

    let overallWinner: PlayerSymbol | 'draw' | null = macroWinner;
    let winningMacroLine: number[] | null = macroLine?.indices || null;

    if (!overallWinner) {
      // Check if all 9 boards are completed (won or drawn)
      const allCompleted = newBoardWins.every((w) => w !== null);
      if (allCompleted) {
        // Count who won more mini boards if macro 3-in-a-row wasn't achieved
        let xCount = 0;
        let oCount = 0;
        newBoardWins.forEach((w) => {
          if (w === 'X') xCount++;
          if (w === 'O') oCount++;
        });
        if (xCount > oCount) overallWinner = 'X';
        else if (oCount > xCount) overallWinner = 'O';
        else overallWinner = 'draw';
      }
    }

    // Next board routing: the opponent is routed to the mini board corresponding to cellIdx
    let nextActiveBoard: number | null = cellIdx;

    // If the next active board is already completed (won or drawn), Free Choice rule triggers!
    if (newBoardWins[nextActiveBoard] !== null || GameEngine.isBoardFull(newBoards[nextActiveBoard])) {
      nextActiveBoard = null; // Free Choice on any active board!
    }

    return {
      boards: newBoards,
      boardWins: newBoardWins,
      activeBoardIndex: nextActiveBoard,
      overallWinner,
      winningMacroLine,
      miniWinningLines: newMiniWinningLines,
    };
  }

  /**
   * Returns list of all legal moves in the format: { boardIdx, cellIdx }
   */
  public static getLegalMoves(state: UltimateBoardState): { boardIdx: number; cellIdx: number }[] {
    if (state.overallWinner !== null) return [];

    const moves: { boardIdx: number; cellIdx: number }[] = [];

    const eligibleBoards =
      state.activeBoardIndex !== null
        ? [state.activeBoardIndex]
        : [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((idx) => state.boardWins[idx] === null);

    for (const bIdx of eligibleBoards) {
      if (state.boardWins[bIdx] !== null) continue;
      for (let cIdx = 0; cIdx < 9; cIdx++) {
        if (state.boards[bIdx][cIdx] === null) {
          moves.push({ boardIdx: bIdx, cellIdx: cIdx });
        }
      }
    }

    return moves;
  }

  /**
   * Ultimate Tic Tac Toe AI Move Generator (Strategic Heuristic + Minimax)
   */
  public static getAIMove(
    state: UltimateBoardState,
    aiSymbol: PlayerSymbol,
    opponentSymbol: PlayerSymbol,
    difficulty: 'easy' | 'medium' | 'hard' | 'impossible'
  ): { boardIdx: number; cellIdx: number } {
    const legalMoves = this.getLegalMoves(state);
    if (legalMoves.length === 0) return { boardIdx: -1, cellIdx: -1 };
    if (legalMoves.length === 1) return legalMoves[0];

    if (difficulty === 'easy') {
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }

    // 1. Check for immediate macro winning move
    for (const move of legalMoves) {
      const nextState = this.makeMove(state, move.boardIdx, move.cellIdx, aiSymbol);
      if (nextState.overallWinner === aiSymbol) {
        return move;
      }
    }

    // 2. Check for immediate mini board win
    const miniWins: { boardIdx: number; cellIdx: number }[] = [];
    for (const move of legalMoves) {
      const tempMini = [...state.boards[move.boardIdx]];
      tempMini[move.cellIdx] = aiSymbol;
      const { winner } = GameEngine.checkWinner(tempMini, 3, 3);
      if (winner === aiSymbol) {
        miniWins.push(move);
      }
    }

    if (miniWins.length > 0) {
      // Pick the mini win that doesn't send opponent to a board where they immediately win
      for (const m of miniWins) {
        if (state.boardWins[m.cellIdx] !== null) {
          // Sent opponent to a finished board (gives them free choice - only do if safe)
          continue;
        }
        return m;
      }
      return miniWins[0];
    }

    // 3. Block opponent from immediately winning the active mini board
    for (const move of legalMoves) {
      const tempMini = [...state.boards[move.boardIdx]];
      tempMini[move.cellIdx] = opponentSymbol;
      const { winner } = GameEngine.checkWinner(tempMini, 3, 3);
      if (winner === opponentSymbol) {
        return move;
      }
    }

    // 4. Strategic move: Prefer center (4) of mini board, then corners (0, 2, 6, 8)
    const strategicRank = [4, 0, 2, 6, 8, 1, 3, 5, 7];
    let bestMove = legalMoves[0];
    let bestScore = -Infinity;

    for (const move of legalMoves) {
      let score = 10 - strategicRank.indexOf(move.cellIdx);

      // Prefer playing in center board (4) of macro board
      if (move.boardIdx === 4) score += 5;

      // Avoid sending opponent to a finished board (giving them free choice)
      if (state.boardWins[move.cellIdx] !== null) {
        score -= 4;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }
}
