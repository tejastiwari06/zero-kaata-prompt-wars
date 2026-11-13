import { describe, expect, it } from 'vitest';
import { GameEngine } from '../engine/GameEngine';
import { CellState } from '../types/game';

describe('GameEngine - Classic Rules & Detection', () => {
  it('detects horizontal win in row 1 on 3x3', () => {
    const board: CellState[] = [
      'X', 'X', 'X',
      'O', 'O', null,
      null, null, null,
    ];
    const { winner, winningLine } = GameEngine.checkWinner(board, 3, 3);
    expect(winner).toBe('X');
    expect(winningLine?.indices).toEqual([0, 1, 2]);
    expect(winningLine?.direction).toBe('horizontal');
  });

  it('detects vertical win in col 2 on 3x3', () => {
    const board: CellState[] = [
      'X', 'O', null,
      'X', 'O', null,
      null, 'O', 'X',
    ];
    const { winner, winningLine } = GameEngine.checkWinner(board, 3, 3);
    expect(winner).toBe('O');
    expect(winningLine?.indices).toEqual([1, 4, 7]);
    expect(winningLine?.direction).toBe('vertical');
  });

  it('detects main diagonal win on 3x3', () => {
    const board: CellState[] = [
      'X', 'O', null,
      'O', 'X', null,
      null, null, 'X',
    ];
    const { winner, winningLine } = GameEngine.checkWinner(board, 3, 3);
    expect(winner).toBe('X');
    expect(winningLine?.indices).toEqual([0, 4, 8]);
    expect(winningLine?.direction).toBe('diagonal_main');
  });

  it('detects anti-diagonal win on 3x3', () => {
    const board: CellState[] = [
      null, 'X', 'O',
      'X', 'O', null,
      'O', null, 'X',
    ];
    const { winner, winningLine } = GameEngine.checkWinner(board, 3, 3);
    expect(winner).toBe('O');
    expect(winningLine?.indices).toEqual([2, 4, 6]);
    expect(winningLine?.direction).toBe('diagonal_anti');
  });

  it('detects draw when board is completely filled without winning triad', () => {
    const board: CellState[] = [
      'X', 'O', 'X',
      'X', 'O', 'O',
      'O', 'X', 'X',
    ];
    const terminal = GameEngine.checkTerminalState(board, 3, 3);
    expect(terminal.isTerminal).toBe(true);
    expect(terminal.winner).toBeNull();
    expect(terminal.isDraw).toBe(true);
  });

  it('prevents illegal move on already occupied cell', () => {
    const board: CellState[] = [
      'X', null, null,
      null, null, null,
      null, null, null,
    ];
    expect(GameEngine.isValidMove(board, 0)).toBe(false);
    expect(GameEngine.isValidMove(board, 1)).toBe(true);
  });

  it('handles 4x4 larger board 4-in-a-row winning detection', () => {
    const board: CellState[] = Array(16).fill(null);
    board[0] = 'X';
    board[5] = 'X';
    board[10] = 'X';
    board[15] = 'X'; // Main diagonal 0, 5, 10, 15

    const { winner, winningLine } = GameEngine.checkWinner(board, 4, 4);
    expect(winner).toBe('X');
    expect(winningLine?.indices).toEqual([0, 5, 10, 15]);
  });
});
