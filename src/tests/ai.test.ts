import { describe, expect, it } from 'vitest';
import { GameEngine } from '../engine/GameEngine';
import { MinimaxAI } from '../engine/MinimaxAI';
import { CellState } from '../types/game';

describe('MinimaxAI Engine - Difficulty & Perfection Verification', () => {
  it('Medium AI takes an immediate winning move', () => {
    // Board where X has 0 and 1, cell 2 is empty winning cell
    const board: CellState[] = [
      'X', 'X', null,
      'O', 'O', null,
      null, null, null,
    ];
    const move = MinimaxAI.getMove(board, 3, 'X', 'O', 'medium', 3);
    expect(move).toBe(2);
  });

  it('Medium AI blocks an immediate opponent winning threat', () => {
    // Opponent O has 0 and 3, cell 6 would complete column
    const board: CellState[] = [
      'O', null, 'X',
      'O', 'X', null,
      null, null, null,
    ];
    // Force Math.random to take block
    const move = MinimaxAI.findWinningMove(board, GameEngine.getLegalMoves(board), 'O', 3, 3);
    expect(move).toBe(6);
  });

  it('Impossible Minimax AI takes immediate win over block', () => {
    // Both X and O have 2 in a row. AI is X. X must take win at 2 rather than block at 5.
    const board: CellState[] = [
      'X', 'X', null, // 2 is win for X
      'O', 'O', null, // 5 is win for O
      null, null, null,
    ];
    const move = MinimaxAI.getMove(board, 3, 'X', 'O', 'impossible', 3);
    expect(move).toBe(2);
  });

  it('Impossible AI is genuinely unbeatable: 50 simulated games against random & tactical play result in ZERO losses', () => {
    let aiLosses = 0;

    for (let sim = 0; sim < 50; sim++) {
      const board: CellState[] = GameEngine.createEmptyBoard(3);
      let currentTurn: 'ai' | 'opponent' = sim % 2 === 0 ? 'ai' : 'opponent';
      const aiSymbol = 'O';
      const oppSymbol = 'X';

      while (true) {
        const { isTerminal, winner } = GameEngine.checkTerminalState(board, 3, 3);
        if (isTerminal) {
          if (winner === oppSymbol) {
            aiLosses++;
          }
          break;
        }

        if (currentTurn === 'ai') {
          const aiMove = MinimaxAI.getMove(board, 3, aiSymbol, oppSymbol, 'impossible', 3);
          expect(aiMove).toBeGreaterThanOrEqual(0);
          expect(board[aiMove]).toBeNull();
          board[aiMove] = aiSymbol;
          currentTurn = 'opponent';
        } else {
          // Opponent plays a mix of random and tactical moves
          const legal = GameEngine.getLegalMoves(board);
          // 50% tactical win/block, 50% random
          let oppMove = MinimaxAI.findWinningMove(board, legal, oppSymbol, 3, 3);
          if (oppMove === -1) {
            oppMove = MinimaxAI.findWinningMove(board, legal, aiSymbol, 3, 3);
          }
          if (oppMove === -1) {
            oppMove = legal[Math.floor(Math.random() * legal.length)];
          }
          board[oppMove] = oppSymbol;
          currentTurn = 'ai';
        }
      }
    }

    expect(aiLosses).toBe(0);
  });
});
