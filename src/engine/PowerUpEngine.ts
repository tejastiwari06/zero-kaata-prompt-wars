import {
  BoardSize,
  CellState,
  FrozenCellInfo,
  PlayerSymbol,
  PowerUpDefinition,
  PowerUpInventory,
  PowerUpType,
  ShieldInfo,
} from '../types/game';
import { GameEngine } from './GameEngine';
import { MinimaxAI } from './MinimaxAI';

export const POWER_UP_DEFINITIONS: Record<PowerUpType, PowerUpDefinition> = {
  undo: {
    type: 'undo',
    name: 'Chrono Rewind',
    icon: '⏪',
    description: 'Rewind the most recent turn. In AI mode, resets both your move and the AI countermove.',
    cost: 1,
    maxPerMatch: 2,
    requiresTarget: false,
    targetType: 'none',
  },
  eraser: {
    type: 'eraser',
    name: 'Quantum Eraser',
    icon: '✨',
    description: 'Vaporize any unshielded symbol on the board to reopen a critical grid vector.',
    cost: 1,
    maxPerMatch: 2,
    requiresTarget: true,
    targetType: 'any_occupied',
  },
  shield: {
    type: 'shield',
    name: 'Aegis Shield',
    icon: '🛡️',
    description: 'Encase one of your placed symbols in an impenetrable energy barrier for 2 turns.',
    cost: 1,
    maxPerMatch: 2,
    requiresTarget: true,
    targetType: 'own_occupied',
  },
  swap: {
    type: 'swap',
    name: 'Polarity Swap',
    icon: '🔄',
    description: 'Transpose any two unshielded cells on the board, fundamentally altering the board balance.',
    cost: 1,
    maxPerMatch: 1,
    requiresTarget: true,
    targetType: 'any_occupied',
  },
  hint: {
    type: 'hint',
    name: 'Tactical Oracle',
    icon: '💡',
    description: 'Invoke the master AI engine to reveal the mathematically optimal cell with tactical analysis.',
    cost: 1,
    maxPerMatch: 3,
    requiresTarget: false,
    targetType: 'none',
  },
  freeze: {
    type: 'freeze',
    name: 'Cryo Stasis',
    icon: '❄️',
    description: 'Freeze an empty grid cell for 2 turns, denying your opponent access to key positions.',
    cost: 1,
    maxPerMatch: 2,
    requiresTarget: true,
    targetType: 'empty',
  },
  double_move: {
    type: 'double_move',
    name: 'Hyper Surge',
    icon: '⚡',
    description: 'Channel lightning energy to execute two consecutive moves in a single turn!',
    cost: 1,
    maxPerMatch: 1,
    requiresTarget: false,
    targetType: 'none',
  },
};

export class PowerUpEngine {
  /**
   * Initializes default inventory for a match
   */
  public static createInitialInventory(): PowerUpInventory {
    const inv: PowerUpInventory = {};
    for (const key of Object.keys(POWER_UP_DEFINITIONS) as PowerUpType[]) {
      inv[key] = POWER_UP_DEFINITIONS[key].maxPerMatch;
    }
    return inv;
  }

  /**
   * Validates if a player has available charges for a power-up
   */
  public static hasCharges(inventory: PowerUpInventory, type: PowerUpType): boolean {
    return (inventory[type] || 0) > 0;
  }

  /**
   * Deducts one charge from inventory
   */
  public static consumeCharge(inventory: PowerUpInventory, type: PowerUpType): PowerUpInventory {
    return {
      ...inventory,
      [type]: Math.max(0, (inventory[type] || 0) - 1),
    };
  }

  /**
   * Validates if a target cell is eligible for an Eraser
   */
  public static canErase(
    board: CellState[],
    cellIndex: number,
    shields: ShieldInfo[]
  ): { valid: boolean; reason?: string } {
    if (board[cellIndex] === null) {
      return { valid: false, reason: 'Target cell is empty.' };
    }

    const isShielded = shields.some((s) => s.cellIndex === cellIndex && s.expiresInTurns > 0);
    if (isShielded) {
      return { valid: false, reason: 'This cell is shielded by an energy barrier!' };
    }

    return { valid: true };
  }

  /**
   * Validates if a target cell is eligible for a Shield
   */
  public static canShield(
    board: CellState[],
    cellIndex: number,
    playerSymbol: PlayerSymbol,
    shields: ShieldInfo[]
  ): { valid: boolean; reason?: string } {
    if (board[cellIndex] !== playerSymbol) {
      return { valid: false, reason: 'You can only shield your own placed symbols.' };
    }

    const isAlreadyShielded = shields.some(
      (s) => s.cellIndex === cellIndex && s.expiresInTurns > 0
    );
    if (isAlreadyShielded) {
      return { valid: false, reason: 'This symbol is already shielded.' };
    }

    return { valid: true };
  }

  /**
   * Validates if a target cell is eligible for Cryo Freeze
   */
  public static canFreeze(
    board: CellState[],
    cellIndex: number,
    frozenCells: FrozenCellInfo[]
  ): { valid: boolean; reason?: string } {
    if (board[cellIndex] !== null) {
      return { valid: false, reason: 'Freeze can only be applied to empty grid cells.' };
    }

    const isFrozen = frozenCells.some((f) => f.cellIndex === cellIndex && f.expiresInTurns > 0);
    if (isFrozen) {
      return { valid: false, reason: 'This cell is already frozen in stasis.' };
    }

    return { valid: true };
  }

  /**
   * Validates if two cells can be swapped
   */
  public static canSwap(
    board: CellState[],
    firstIndex: number,
    secondIndex: number,
    shields: ShieldInfo[]
  ): { valid: boolean; reason?: string } {
    if (firstIndex === secondIndex) {
      return { valid: false, reason: 'Cannot swap a cell with itself.' };
    }

    const firstShielded = shields.some((s) => s.cellIndex === firstIndex && s.expiresInTurns > 0);
    const secondShielded = shields.some((s) => s.cellIndex === secondIndex && s.expiresInTurns > 0);

    if (firstShielded || secondShielded) {
      return { valid: false, reason: 'Shielded cells cannot be displaced by Polarity Swap.' };
    }

    // At least one cell should have a symbol
    if (board[firstIndex] === null && board[secondIndex] === null) {
      return { valid: false, reason: 'Swapping two empty cells has no effect.' };
    }

    return { valid: true };
  }

  /**
   * Decrements shield and frozen cell durations at the end of a round
   */
  public static tickDurations(
    shields: ShieldInfo[],
    frozenCells: FrozenCellInfo[]
  ): { shields: ShieldInfo[]; frozenCells: FrozenCellInfo[] } {
    const updatedShields = shields
      .map((s) => ({ ...s, expiresInTurns: s.expiresInTurns - 1 }))
      .filter((s) => s.expiresInTurns > 0);

    const updatedFrozen = frozenCells
      .map((f) => ({ ...f, expiresInTurns: f.expiresInTurns - 1 }))
      .filter((f) => f.expiresInTurns > 0);

    return { shields: updatedShields, frozenCells: updatedFrozen };
  }

  /**
   * Generates a real tactical hint for the current board state
   */
  public static getTacticalHint(
    board: CellState[],
    size: BoardSize,
    playerSymbol: PlayerSymbol,
    opponentSymbol: PlayerSymbol,
    frozenIndices: number[] = []
  ): { recommendedCell: number; rationale: string } {
    const legalMoves = GameEngine.getLegalMoves(board, frozenIndices);
    if (legalMoves.length === 0) {
      return { recommendedCell: -1, rationale: 'No legal moves remaining.' };
    }

    // 1. Winning move available?
    const winMove = MinimaxAI.findWinningMove(board, legalMoves, playerSymbol, size, size);
    if (winMove !== -1) {
      return {
        recommendedCell: winMove,
        rationale: 'Immediate victory vector! Playing here completes three in a row for the win.',
      };
    }

    // 2. Immediate block needed?
    const blockMove = MinimaxAI.findWinningMove(board, legalMoves, opponentSymbol, size, size);
    if (blockMove !== -1) {
      return {
        recommendedCell: blockMove,
        rationale: 'Critical defensive emergency! Your opponent is threatening to win on this exact cell next turn.',
      };
    }

    // 3. Center control
    const center = Math.floor((size * size) / 2);
    if (legalMoves.includes(center)) {
      return {
        recommendedCell: center,
        rationale: 'Center dominance: The central nexus anchors 4 distinct winning axes (row, column, 2 diagonals).',
      };
    }

    // 4. Optimal minimax move
    const bestMove = MinimaxAI.getMove(
      board,
      size,
      playerSymbol,
      opponentSymbol,
      'impossible',
      size,
      frozenIndices
    );

    return {
      recommendedCell: bestMove,
      rationale: 'Strategic fork positioning: Maximizes your future offensive options while restricting opponent counter-play.',
    };
  }
}
