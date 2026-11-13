import { BoardSize, CellState, MatchAnalysis, MoveRecord, PlayerSymbol, TacticalOpportunity } from '../types/game';
import { GameEngine } from './GameEngine';
import { MinimaxAI } from './MinimaxAI';

export class PostMatchAnalysis {
  /**
   * Deterministically analyzes a completed match move-by-move
   */
  public static analyze(
    matchId: string,
    moves: MoveRecord[],
    size: BoardSize,
    playerSymbol: PlayerSymbol,
    opponentSymbol: PlayerSymbol,
    durationMs: number
  ): MatchAnalysis {
    const opportunities: TacticalOpportunity[] = [];
    const insights: string[] = [];

    // Replay moves progressively to evaluate tactical points
    const currentBoard: CellState[] = GameEngine.createEmptyBoard(size);

    let playerMovesCount = 0;
    let missedWinCount = 0;
    let missedBlockCount = 0;

    for (let step = 0; step < moves.length; step++) {
      const move = moves[step];
      const isPlayerTurn = move.symbol === playerSymbol;

      if (isPlayerTurn) {
        playerMovesCount++;
        const legalMoves = GameEngine.getLegalMoves(currentBoard);

        // 1. Did player have an immediate winning move?
        const immediateWin = MinimaxAI.findWinningMove(
          currentBoard,
          legalMoves,
          playerSymbol,
          size,
          size
        );

        if (immediateWin !== -1 && move.index !== immediateWin) {
          missedWinCount++;
          const row = Math.floor(immediateWin / size) + 1;
          const col = (immediateWin % size) + 1;
          opportunities.push({
            step: step + 1,
            type: 'missed_win',
            cellIndex: immediateWin,
            explanation: `Turn ${step + 1}: Missed immediate victory at row ${row}, col ${col}. Playing there would have won the match on this turn.`,
          });
        }

        // 2. Did opponent threaten an immediate win that player failed to block?
        const opponentThreat = MinimaxAI.findWinningMove(
          currentBoard,
          legalMoves,
          opponentSymbol,
          size,
          size
        );

        if (opponentThreat !== -1 && move.index !== opponentThreat && immediateWin === -1) {
          missedBlockCount++;
          const row = Math.floor(opponentThreat / size) + 1;
          const col = (opponentThreat % size) + 1;
          opportunities.push({
            step: step + 1,
            type: 'missed_block',
            cellIndex: opponentThreat,
            explanation: `Turn ${step + 1}: Defensive breakdown at row ${row}, col ${col}. Opponent had an open line to victory here on their next move.`,
          });
        }
      }

      // Apply move to simulator board
      currentBoard[move.index] = move.symbol;
    }

    // Calculate accuracy score
    // Formula: 100 base minus 25 per missed win, 18 per missed block, floored at 10
    const deductions = missedWinCount * 25 + missedBlockCount * 18;
    const accuracyScore = Math.max(15, Math.min(100, Math.round(100 - deductions)));

    // Generate summary insights
    if (missedWinCount === 0 && missedBlockCount === 0) {
      insights.push('Tactical Precision: You did not miss any immediate winning shots or defensive blocks!');
    }
    if (missedWinCount > 0) {
      insights.push(`Opportunity Loss: You had ${missedWinCount} immediate game-ending opportunity that went unplayed.`);
    }
    if (missedBlockCount > 0) {
      insights.push(`Defensive Gap: You conceded ${missedBlockCount} open threats which allowed the opponent to pressure your lines.`);
    }

    if (moves.length <= 5 && accuracyScore > 80) {
      insights.push('Blitz Efficiency: Fast decisive play with high strategic precision.');
    } else if (moves.length >= 9) {
      insights.push('Endgame Resilience: Grinded through all phases into a deep endgame battle.');
    }

    return {
      matchId,
      totalMoves: moves.length,
      durationMs,
      accuracyScore,
      opportunities,
      summaryInsights: insights,
    };
  }
}
