import { BoardSize, CellState, PlayerSymbol, WinningLine } from '../types/game';

export class GameEngine {
  /**
   * Pre-calculates all winning combinations for a given board size and consecutive target
   */
  public static getWinningLines(size: BoardSize, winStreak: number = size): number[][] {
    const lines: number[][] = [];

    // Horizontal lines
    for (let r = 0; r < size; r++) {
      for (let c = 0; c <= size - winStreak; c++) {
        const line: number[] = [];
        for (let k = 0; k < winStreak; k++) {
          line.push(r * size + (c + k));
        }
        lines.push(line);
      }
    }

    // Vertical lines
    for (let c = 0; c < size; c++) {
      for (let r = 0; r <= size - winStreak; r++) {
        const line: number[] = [];
        for (let k = 0; k < winStreak; k++) {
          line.push((r + k) * size + c);
        }
        lines.push(line);
      }
    }

    // Diagonal lines (top-left to bottom-right)
    for (let r = 0; r <= size - winStreak; r++) {
      for (let c = 0; c <= size - winStreak; c++) {
        const line: number[] = [];
        for (let k = 0; k < winStreak; k++) {
          line.push((r + k) * size + (c + k));
        }
        lines.push(line);
      }
    }

    // Anti-diagonal lines (top-right to bottom-left)
    for (let r = 0; r <= size - winStreak; r++) {
      for (let c = winStreak - 1; c < size; c++) {
        const line: number[] = [];
        for (let k = 0; k < winStreak; k++) {
          line.push((r + k) * size + (c - k));
        }
        lines.push(line);
      }
    }

    return lines;
  }

  /**
   * Checks if a player has won on the given board
   */
  public static checkWinner(
    board: CellState[],
    size: BoardSize,
    winStreak: number = size
  ): { winner: PlayerSymbol | null; winningLine: WinningLine | null } {
    const lines = this.getWinningLines(size, winStreak);

    for (const line of lines) {
      const first = board[line[0]];
      if (!first) continue;

      let allMatch = true;
      for (let i = 1; i < line.length; i++) {
        if (board[line[i]] !== first) {
          allMatch = false;
          break;
        }
      }

      if (allMatch) {
        // Determine line direction for animation rendering
        let direction: WinningLine['direction'] = 'horizontal';
        const [a, b] = [line[0], line[1]];
        if (Math.floor(a / size) === Math.floor(b / size)) {
          direction = 'horizontal';
        } else if (a % size === b % size) {
          direction = 'vertical';
        } else if (b - a === size + 1) {
          direction = 'diagonal_main';
        } else {
          direction = 'diagonal_anti';
        }

        return {
          winner: first,
          winningLine: {
            indices: line,
            direction,
          },
        };
      }
    }

    return { winner: null, winningLine: null };
  }

  /**
   * Checks if the board is full and no moves remain
   */
  public static isBoardFull(board: CellState[]): boolean {
    return board.every((cell) => cell !== null);
  }

  /**
   * Checks if the match has reached a terminal state (win or draw)
   */
  public static checkTerminalState(
    board: CellState[],
    size: BoardSize,
    winStreak: number = size
  ): { isTerminal: boolean; winner: PlayerSymbol | null; isDraw: boolean; winningLine: WinningLine | null } {
    const { winner, winningLine } = this.checkWinner(board, size, winStreak);
    if (winner) {
      return { isTerminal: true, winner, isDraw: false, winningLine };
    }

    if (this.isBoardFull(board)) {
      return { isTerminal: true, winner: null, isDraw: true, winningLine: null };
    }

    return { isTerminal: false, winner: null, isDraw: false, winningLine: null };
  }

  /**
   * Returns all indices of legal empty cells
   */
  public static getLegalMoves(board: CellState[], restrictedIndices: number[] = []): number[] {
    const legal: number[] = [];
    const restrictedSet = new Set(restrictedIndices);

    for (let i = 0; i < board.length; i++) {
      if (board[i] === null && !restrictedSet.has(i)) {
        legal.push(i);
      }
    }
    return legal;
  }

  /**
   * Validates if a move can be placed at the target index
   */
  public static isValidMove(
    board: CellState[],
    index: number,
    restrictedIndices: number[] = []
  ): boolean {
    if (index < 0 || index >= board.length) return false;
    if (board[index] !== null) return false;
    if (restrictedIndices.includes(index)) return false;
    return true;
  }

  /**
   * Creates an empty board of the designated size
   */
  public static createEmptyBoard(size: BoardSize): CellState[] {
    return Array(size * size).fill(null);
  }
}
