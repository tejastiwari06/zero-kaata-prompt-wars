import { AIDifficulty, BoardSize, CellState, PlayerSymbol } from '../types/game';
import { GameEngine } from './GameEngine';

export class MinimaxAI {
  /**
   * Main entry point to get the AI's move according to selected difficulty
   */
  public static getMove(
    board: CellState[],
    size: BoardSize,
    aiSymbol: PlayerSymbol,
    opponentSymbol: PlayerSymbol,
    difficulty: AIDifficulty,
    winStreak: number = size,
    restrictedIndices: number[] = []
  ): number {
    const legalMoves = GameEngine.getLegalMoves(board, restrictedIndices);
    if (legalMoves.length === 0) return -1;
    if (legalMoves.length === 1) return legalMoves[0];

    switch (difficulty) {
      case 'easy':
        return this.getEasyMove(board, legalMoves, aiSymbol, size, winStreak);
      case 'medium':
        return this.getMediumMove(board, legalMoves, aiSymbol, opponentSymbol, size, winStreak);
      case 'hard':
        return this.getHardMove(board, legalMoves, aiSymbol, opponentSymbol, size, winStreak);
      case 'impossible':
      default:
        return this.getImpossibleMove(board, legalMoves, aiSymbol, opponentSymbol, size, winStreak);
    }
  }

  /**
   * Easy AI: Mostly random, occasionally plays tactical move (~20% chance)
   */
  private static getEasyMove(
    board: CellState[],
    legalMoves: number[],
    aiSymbol: PlayerSymbol,
    size: BoardSize,
    winStreak: number
  ): number {
    // 25% chance to take an immediate win if available
    if (Math.random() < 0.25) {
      const winMove = this.findWinningMove(board, legalMoves, aiSymbol, size, winStreak);
      if (winMove !== -1) return winMove;
    }

    // Otherwise random legal move
    const randomIndex = Math.floor(Math.random() * legalMoves.length);
    return legalMoves[randomIndex];
  }

  /**
   * Medium AI: Takes immediate win, blocks immediate loss, otherwise selects strategically with occasional imperfection
   */
  private static getMediumMove(
    board: CellState[],
    legalMoves: number[],
    aiSymbol: PlayerSymbol,
    opponentSymbol: PlayerSymbol,
    size: BoardSize,
    winStreak: number
  ): number {
    // 1. Check for immediate winning move (100% takes it)
    const winMove = this.findWinningMove(board, legalMoves, aiSymbol, size, winStreak);
    if (winMove !== -1) return winMove;

    // 2. Block immediate opponent win (85% of the time)
    if (Math.random() < 0.85) {
      const blockMove = this.findWinningMove(board, legalMoves, opponentSymbol, size, winStreak);
      if (blockMove !== -1) return blockMove;
    }

    // 3. Take center if available on 3x3
    if (size === 3 && legalMoves.includes(4) && Math.random() < 0.7) {
      return 4;
    }

    // 4. Otherwise pick from corners or random
    const corners = [0, 2, 6, 8].filter((c) => legalMoves.includes(c));
    if (corners.length > 0 && Math.random() < 0.5) {
      return corners[Math.floor(Math.random() * corners.length)];
    }

    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }

  /**
   * Hard AI: Full tactical evaluation with fork recognition and fork blocking
   */
  private static getHardMove(
    board: CellState[],
    legalMoves: number[],
    aiSymbol: PlayerSymbol,
    opponentSymbol: PlayerSymbol,
    size: BoardSize,
    winStreak: number
  ): number {
    // 1. Immediate Win
    const winMove = this.findWinningMove(board, legalMoves, aiSymbol, size, winStreak);
    if (winMove !== -1) return winMove;

    // 2. Immediate Block
    const blockMove = this.findWinningMove(board, legalMoves, opponentSymbol, size, winStreak);
    if (blockMove !== -1) return blockMove;

    // 3. Create Fork: Move that creates two winning opportunities
    for (const move of legalMoves) {
      const tempBoard = [...board];
      tempBoard[move] = aiSymbol;
      if (this.countWinningThreats(tempBoard, aiSymbol, size, winStreak) >= 2) {
        return move;
      }
    }

    // 4. Block Opponent's Fork
    for (const move of legalMoves) {
      const tempBoard = [...board];
      tempBoard[move] = opponentSymbol;
      if (this.countWinningThreats(tempBoard, opponentSymbol, size, winStreak) >= 2) {
        return move;
      }
    }

    // 5. Center preference
    const center = Math.floor((size * size) / 2);
    if (legalMoves.includes(center)) return center;

    // 6. Corners
    const corners = [0, size - 1, size * (size - 1), size * size - 1].filter((c) =>
      legalMoves.includes(c)
    );
    if (corners.length > 0) {
      return corners[Math.floor(Math.random() * corners.length)];
    }

    // 7. Remaining moves
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }

  /**
   * Impossible AI: Unbeatable Minimax with Alpha-Beta Pruning.
   * On 3x3 standard boards, this will NEVER lose.
   */
  private static getImpossibleMove(
    board: CellState[],
    legalMoves: number[],
    aiSymbol: PlayerSymbol,
    opponentSymbol: PlayerSymbol,
    size: BoardSize,
    winStreak: number
  ): number {
    // Fast path: If center is available on move 1 or 2, taking center is mathematically optimal
    const center = Math.floor((size * size) / 2);
    if (size === 3 && legalMoves.length >= 8 && legalMoves.includes(center)) {
      return center;
    }

    let bestScore = -Infinity;
    let bestMove = legalMoves[0];

    const maxDepth = size === 3 ? 9 : size === 4 ? 4 : 3;

    for (const move of legalMoves) {
      board[move] = aiSymbol;
      const score = this.minimax(
        board,
        0,
        false,
        -Infinity,
        Infinity,
        aiSymbol,
        opponentSymbol,
        size,
        winStreak,
        maxDepth
      );
      board[move] = null;

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  /**
   * Minimax algorithm with Alpha-Beta pruning
   */
  private static minimax(
    board: CellState[],
    depth: number,
    isMaximizing: boolean,
    alpha: number,
    beta: number,
    aiSymbol: PlayerSymbol,
    opponentSymbol: PlayerSymbol,
    size: BoardSize,
    winStreak: number,
    maxDepth: number
  ): number {
    const { winner, isDraw } = GameEngine.checkTerminalState(board, size, winStreak);

    if (winner === aiSymbol) {
      return 100 - depth;
    }
    if (winner === opponentSymbol) {
      return depth - 100;
    }
    if (isDraw || depth >= maxDepth) {
      return this.heuristicScore(board, aiSymbol, opponentSymbol, size, winStreak);
    }

    const legalMoves = GameEngine.getLegalMoves(board);

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of legalMoves) {
        board[move] = aiSymbol;
        const evaluation = this.minimax(
          board,
          depth + 1,
          false,
          alpha,
          beta,
          aiSymbol,
          opponentSymbol,
          size,
          winStreak,
          maxDepth
        );
        board[move] = null;
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of legalMoves) {
        board[move] = opponentSymbol;
        const evaluation = this.minimax(
          board,
          depth + 1,
          true,
          alpha,
          beta,
          aiSymbol,
          opponentSymbol,
          size,
          winStreak,
          maxDepth
        );
        board[move] = null;
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  /**
   * Helper to check if any legal move immediately wins the game
   */
  public static findWinningMove(
    board: CellState[],
    legalMoves: number[],
    symbol: PlayerSymbol,
    size: BoardSize,
    winStreak: number
  ): number {
    for (const move of legalMoves) {
      board[move] = symbol;
      const { winner } = GameEngine.checkWinner(board, size, winStreak);
      board[move] = null;
      if (winner === symbol) {
        return move;
      }
    }
    return -1;
  }

  /**
   * Count how many winning threats a player has on the board
   */
  private static countWinningThreats(
    board: CellState[],
    symbol: PlayerSymbol,
    size: BoardSize,
    winStreak: number
  ): number {
    let threats = 0;
    const legalMoves = GameEngine.getLegalMoves(board);

    for (const move of legalMoves) {
      board[move] = symbol;
      const { winner } = GameEngine.checkWinner(board, size, winStreak);
      board[move] = null;
      if (winner === symbol) {
        threats++;
      }
    }
    return threats;
  }

  /**
   * Heuristic static evaluation function for depth-limited search
   */
  private static heuristicScore(
    board: CellState[],
    aiSymbol: PlayerSymbol,
    opponentSymbol: PlayerSymbol,
    size: BoardSize,
    winStreak: number
  ): number {
    let score = 0;
    const lines = GameEngine.getWinningLines(size, winStreak);

    for (const line of lines) {
      let aiCount = 0;
      let oppCount = 0;

      for (const idx of line) {
        if (board[idx] === aiSymbol) aiCount++;
        else if (board[idx] === opponentSymbol) oppCount++;
      }

      // If line is exclusively AI
      if (aiCount > 0 && oppCount === 0) {
        score += Math.pow(10, aiCount);
      }
      // If line is exclusively Opponent
      else if (oppCount > 0 && aiCount === 0) {
        score -= Math.pow(10, oppCount);
      }
    }

    return score;
  }
}
