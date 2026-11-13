import { describe, expect, it } from 'vitest';
import { PowerUpEngine } from '../engine/PowerUpEngine';
import { CellState, ShieldInfo } from '../types/game';

describe('PowerUpEngine - Strategic Abilities & Constraints', () => {
  it('deducts inventory charges and prevents use when exhausted', () => {
    let inv = PowerUpEngine.createInitialInventory();
    expect(PowerUpEngine.hasCharges(inv, 'eraser')).toBe(true);

    inv = PowerUpEngine.consumeCharge(inv, 'eraser');
    inv = PowerUpEngine.consumeCharge(inv, 'eraser');

    expect(PowerUpEngine.hasCharges(inv, 'eraser')).toBe(false);
  });

  it('shield prevents Eraser from removing protected symbol', () => {
    const board: CellState[] = ['X', 'O', null, null, null, null, null, null, null];
    const shields: ShieldInfo[] = [{ cellIndex: 0, symbol: 'X', expiresInTurns: 2 }];

    // Cell 0 is shielded
    const checkShielded = PowerUpEngine.canErase(board, 0, shields);
    expect(checkShielded.valid).toBe(false);

    // Cell 1 is not shielded
    const checkUnshielded = PowerUpEngine.canErase(board, 1, shields);
    expect(checkUnshielded.valid).toBe(true);
  });

  it('shield prevents Swap from moving protected symbol', () => {
    const board: CellState[] = ['X', 'O', null, null, null, null, null, null, null];
    const shields: ShieldInfo[] = [{ cellIndex: 0, symbol: 'X', expiresInTurns: 2 }];

    const swapResult = PowerUpEngine.canSwap(board, 0, 1, shields);
    expect(swapResult.valid).toBe(false);
    expect(swapResult.reason).toContain('Shielded cells cannot be displaced');
  });

  it('ticks durations down and expires shields and frozen cells', () => {
    const shields: ShieldInfo[] = [{ cellIndex: 0, symbol: 'X', expiresInTurns: 1 }];
    const frozen = [{ cellIndex: 4, frozenBy: 'X', expiresInTurns: 1 }];

    const { shields: nextShields, frozenCells: nextFrozen } = PowerUpEngine.tickDurations(
      shields,
      frozen
    );

    expect(nextShields.length).toBe(0);
    expect(nextFrozen.length).toBe(0);
  });

  it('tactical hint identifies immediate winning cell with explanation', () => {
    const board: CellState[] = ['X', 'X', null, 'O', 'O', null, null, null, null];
    const hint = PowerUpEngine.getTacticalHint(board, 3, 'X', 'O');

    expect(hint.recommendedCell).toBe(2);
    expect(hint.rationale).toContain('Immediate victory vector');
  });
});
