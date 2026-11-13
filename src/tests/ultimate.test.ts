import { describe, expect, it } from 'vitest';
import { UltimateEngine } from '../engine/UltimateEngine';

describe('Ultimate Tic Tac Toe - Routing & Macro Win Rules', () => {
  it('correctly routes opponent to mini board matching cell index', () => {
    let state = UltimateEngine.createInitialState();
    // Host plays on board 0 at cell 4 (center)
    state = UltimateEngine.makeMove(state, 0, 4, 'X');

    // Opponent should be routed to board 4
    expect(state.activeBoardIndex).toBe(4);
    expect(state.boards[0][4]).toBe('X');
  });

  it('triggers Free Choice rule when targeted mini board is won or full', () => {
    let state = UltimateEngine.createInitialState();
    // Manually mark board 2 as won by X
    state.boardWins[2] = 'X';

    // Player moves on board 0 at cell 2
    state = UltimateEngine.makeMove(state, 0, 2, 'O');

    // Since board 2 is already completed, activeBoardIndex should become null (Free Choice!)
    expect(state.activeBoardIndex).toBeNull();
  });

  it('detects mini board win and records winner on macro board', () => {
    let state = UltimateEngine.createInitialState();
    // Simulate X completing top row on board 0 (cells 0, 1, 2)
    state.boards[0][0] = 'X';
    state.boards[0][1] = 'X';
    state.activeBoardIndex = 0;

    state = UltimateEngine.makeMove(state, 0, 2, 'X');

    expect(state.boardWins[0]).toBe('X');
    expect(state.miniWinningLines[0]).toEqual([0, 1, 2]);
  });

  it('detects macro board win when 3 mini boards are won in a row', () => {
    let state = UltimateEngine.createInitialState();
    // Set board 0, 1 as won by X
    state.boardWins[0] = 'X';
    state.boardWins[1] = 'X';

    // Board 2 has cells 0 and 1 occupied by X
    state.boards[2][0] = 'X';
    state.boards[2][1] = 'X';
    state.activeBoardIndex = 2;

    // Move on board 2 cell 2 completes board 2 AND completes macro row [0, 1, 2]
    state = UltimateEngine.makeMove(state, 2, 2, 'X');

    expect(state.boardWins[2]).toBe('X');
    expect(state.overallWinner).toBe('X');
    expect(state.winningMacroLine).toEqual([0, 1, 2]);
  });
});
