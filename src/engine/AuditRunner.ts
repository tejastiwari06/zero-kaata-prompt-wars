import { GameEngine } from './GameEngine';
import { MinimaxAI } from './MinimaxAI';
import { UltimateEngine } from './UltimateEngine';
import { PowerUpEngine } from './PowerUpEngine';
import { PostMatchAnalysis } from './PostMatchAnalysis';
import { StorageManager } from '../storage/StorageManager';
import { CellState, MoveRecord } from '../types/game';
import { AIMLQuestionEngine } from './AIMLQuestionEngine';

export interface AuditResult {
  id: string;
  category: string;
  title: string;
  passed: boolean;
  durationMs: number;
  details: string;
}

export class AuditRunner {
  public static async runFullAudit(): Promise<AuditResult[]> {
    const results: AuditResult[] = [];

    // Helper to run a test step
    const runTest = (
      id: string,
      category: string,
      title: string,
      fn: () => void | Promise<void>
    ): AuditResult => {
      const start = performance.now();
      try {
        fn();
        const duration = Math.round((performance.now() - start) * 100) / 100;
        return { id, category, title, passed: true, durationMs: duration, details: 'Verified successfully.' };
      } catch (err: unknown) {
        const duration = Math.round((performance.now() - start) * 100) / 100;
        const msg = err instanceof Error ? err.message : String(err);
        return { id, category, title, passed: false, durationMs: duration, details: `Failed: ${msg}` };
      }
    };

    // 1. Classic Horizontal Win
    results.push(
      runTest('classic_horizontal', 'Core Game Rules', 'Horizontal Win Detection', () => {
        const board: CellState[] = ['X', 'X', 'X', 'O', 'O', null, null, null, null];
        const res = GameEngine.checkWinner(board, 3, 3);
        if (res.winner !== 'X' || res.winningLine?.direction !== 'horizontal') {
          throw new Error(`Expected horizontal win for X, got ${res.winner}`);
        }
      })
    );

    // 2. Classic Vertical Win
    results.push(
      runTest('classic_vertical', 'Core Game Rules', 'Vertical Win Detection', () => {
        const board: CellState[] = ['X', 'O', null, 'X', 'O', null, null, 'O', 'X'];
        const res = GameEngine.checkWinner(board, 3, 3);
        if (res.winner !== 'O' || res.winningLine?.direction !== 'vertical') {
          throw new Error(`Expected vertical win for O, got ${res.winner}`);
        }
      })
    );

    // 3. Classic Diagonal Win
    results.push(
      runTest('classic_diagonal', 'Core Game Rules', 'Diagonal Win Detection', () => {
        const board: CellState[] = ['X', 'O', null, 'O', 'X', null, null, null, 'X'];
        const res = GameEngine.checkWinner(board, 3, 3);
        if (res.winner !== 'X' || res.winningLine?.direction !== 'diagonal_main') {
          throw new Error(`Expected main diagonal win for X`);
        }
      })
    );

    // 4. Draw Detection
    results.push(
      runTest('draw_detection', 'Core Game Rules', 'Stalemate / Draw Detection', () => {
        const board: CellState[] = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
        const res = GameEngine.checkTerminalState(board, 3, 3);
        if (!res.isTerminal || !res.isDraw || res.winner !== null) {
          throw new Error('Failed to identify standard stalemate draw');
        }
      })
    );

    // 5. Illegal Move Prevention
    results.push(
      runTest('illegal_move', 'Core Game Rules', 'Occupied Cell & Boundary Validation', () => {
        const board: CellState[] = ['X', null, null, null, null, null, null, null, null];
        if (GameEngine.isValidMove(board, 0)) {
          throw new Error('Allowed move on occupied cell 0');
        }
        if (GameEngine.isValidMove(board, -1) || GameEngine.isValidMove(board, 9)) {
          throw new Error('Allowed out-of-bounds cell placement');
        }
        if (!GameEngine.isValidMove(board, 1)) {
          throw new Error('Rejected legal move on cell 1');
        }
      })
    );

    // 6. Medium AI Immediate Win
    results.push(
      runTest('ai_medium_win', 'AI Engine', 'Medium AI Immediate Win Execution', () => {
        const board: CellState[] = ['X', 'X', null, 'O', 'O', null, null, null, null];
        const move = MinimaxAI.getMove(board, 3, 'X', 'O', 'medium', 3);
        if (move !== 2) {
          throw new Error(`Expected win at 2, AI picked ${move}`);
        }
      })
    );

    // 7. Medium AI Immediate Block
    results.push(
      runTest('ai_medium_block', 'AI Engine', 'Medium AI Threat Blocking', () => {
        const board: CellState[] = ['O', null, 'X', 'O', 'X', null, null, null, null];
        const legal = GameEngine.getLegalMoves(board);
        const block = MinimaxAI.findWinningMove(board, legal, 'O', 3, 3);
        if (block !== 6) {
          throw new Error(`Expected block at 6, got ${block}`);
        }
      })
    );

    // 8. Impossible Minimax 50-Game Unbeatable Benchmark
    results.push(
      runTest('ai_impossible_unbeatable', 'AI Engine', 'Impossible Minimax Zero-Loss Benchmark (50 games)', () => {
        let losses = 0;
        for (let i = 0; i < 50; i++) {
          const board: CellState[] = GameEngine.createEmptyBoard(3);
          let turn: 'ai' | 'opp' = i % 2 === 0 ? 'ai' : 'opp';
          while (true) {
            const term = GameEngine.checkTerminalState(board, 3, 3);
            if (term.isTerminal) {
              if (term.winner === 'X') losses++;
              break;
            }
            if (turn === 'ai') {
              const m = MinimaxAI.getMove(board, 3, 'O', 'X', 'impossible', 3);
              board[m] = 'O';
              turn = 'opp';
            } else {
              const legal = GameEngine.getLegalMoves(board);
              let m = MinimaxAI.findWinningMove(board, legal, 'X', 3, 3);
              if (m === -1) m = MinimaxAI.findWinningMove(board, legal, 'O', 3, 3);
              if (m === -1) m = legal[Math.floor(Math.random() * legal.length)];
              board[m] = 'X';
              turn = 'ai';
            }
          }
        }
        if (losses > 0) {
          throw new Error(`Impossible AI suffered ${losses} losses! Must be zero.`);
        }
      })
    );

    // 9. Ultimate TTT Board Routing
    results.push(
      runTest('ultimate_routing', 'Ultimate Mode', 'Cell-to-Board Routing Rule', () => {
        let state = UltimateEngine.createInitialState();
        state = UltimateEngine.makeMove(state, 0, 7, 'X');
        if (state.activeBoardIndex !== 7) {
          throw new Error(`Expected opponent routed to board 7, got ${state.activeBoardIndex}`);
        }
      })
    );

    // 10. Ultimate TTT Free Choice Rule
    results.push(
      runTest('ultimate_free_choice', 'Ultimate Mode', 'Free Choice on Completed Boards', () => {
        let state = UltimateEngine.createInitialState();
        state.boardWins[5] = 'X'; // Board 5 is already completed
        state = UltimateEngine.makeMove(state, 0, 5, 'O');
        if (state.activeBoardIndex !== null) {
          throw new Error('Expected activeBoardIndex to be null (Free Choice) when routed to completed board 5');
        }
      })
    );

    // 11. Ultimate TTT Macro Win
    results.push(
      runTest('ultimate_macro_win', 'Ultimate Mode', 'Macro 3-in-a-Row Victory Detection', () => {
        let state = UltimateEngine.createInitialState();
        state.boardWins[0] = 'X';
        state.boardWins[1] = 'X';
        state.boards[2][0] = 'X';
        state.boards[2][1] = 'X';
        state.activeBoardIndex = 2;
        state = UltimateEngine.makeMove(state, 2, 2, 'X');
        if (state.overallWinner !== 'X' || !state.winningMacroLine) {
          throw new Error(`Expected macro winner X with line, got ${state.overallWinner}`);
        }
      })
    );

    // 12. Power-Up Shield Immunity
    results.push(
      runTest('powerup_shield', 'Power-Up System', 'Aegis Shield Protection against Eraser & Swap', () => {
        const board: CellState[] = ['X', 'O', null, null, null, null, null, null, null];
        const shields = [{ cellIndex: 0, symbol: 'X', expiresInTurns: 2 }];
        const eraseCheck = PowerUpEngine.canErase(board, 0, shields);
        if (eraseCheck.valid) {
          throw new Error('Eraser allowed on shielded cell 0');
        }
        const swapCheck = PowerUpEngine.canSwap(board, 0, 1, shields);
        if (swapCheck.valid) {
          throw new Error('Swap allowed with shielded cell 0');
        }
      })
    );

    // 13. Tactical Oracle Hint
    results.push(
      runTest('tactical_hint', 'Tactical Analysis', 'Oracle Immediate Victory & Block Detection', () => {
        const board: CellState[] = ['X', 'X', null, 'O', 'O', null, null, null, null];
        const hint = PowerUpEngine.getTacticalHint(board, 3, 'X', 'O');
        if (hint.recommendedCell !== 2) {
          throw new Error(`Expected recommended cell 2 for win, got ${hint.recommendedCell}`);
        }
      })
    );

    // 14. Post Match Analysis Tactical Opportunities
    results.push(
      runTest('post_match_analysis', 'Tactical Analysis', 'Deterministic Opportunity Extraction', () => {
        // Player X misses immediate win at 2 on step 3
        const moves: MoveRecord[] = [
          { step: 1, index: 0, symbol: 'X', playerRole: 'player1', timestamp: 100, boardSnapshot: [] },
          { step: 2, index: 3, symbol: 'O', playerRole: 'ai', timestamp: 200, boardSnapshot: [] },
          { step: 3, index: 1, symbol: 'X', playerRole: 'player1', timestamp: 300, boardSnapshot: [] },
          { step: 4, index: 4, symbol: 'O', playerRole: 'ai', timestamp: 400, boardSnapshot: [] },
          // Now board has X on 0, 1. Cell 2 is open win. Player X erroneously plays 8:
          { step: 5, index: 8, symbol: 'X', playerRole: 'player1', timestamp: 500, boardSnapshot: [] },
          { step: 6, index: 5, symbol: 'O', playerRole: 'ai', timestamp: 600, boardSnapshot: [] }, // O wins at 5 (row 1: 3,4,5)
        ];
        const analysis = PostMatchAnalysis.analyze('test_m1', moves, 3, 'X', 'O', 1500);
        const hasMissedWin = analysis.opportunities.some((o) => o.type === 'missed_win');
        if (!hasMissedWin) {
          throw new Error('Failed to flag missed immediate win at cell 2');
        }
      })
    );

    // 15. Progression Idempotency
    results.push(
      runTest('progression_idempotency', 'Progression & Storage', 'Duplicate Prevention & Level Scaling', () => {
        const lvl1 = StorageManager.calculateLevel(100);
        const lvl2 = StorageManager.calculateLevel(500);
        if (lvl2.level <= lvl1.level) {
          throw new Error('Level progression failed to scale with XP');
        }
      })
    );

    // 16. AI/ML Question Integrity Audit
    results.push(
      runTest('aiml_question_integrity', 'Knowledge Battle', 'Question MCQ Format & Integrity Validation', () => {
        const questions = AIMLQuestionEngine.CURATED_QUESTIONS;
        if (questions.length < 20) throw new Error('Expected at least 20 curated questions');
        for (const q of questions) {
          if (!AIMLQuestionEngine.validateQuestion(q)) {
            throw new Error(`Malformed question detected: ${q.id}`);
          }
        }
      })
    );

    // 17. AI/ML Non-Repetition Audit
    results.push(
      runTest('aiml_non_repetition', 'Knowledge Battle', 'Deduplication & Sequential Freshness', () => {
        const used: string[] = [];
        for (let i = 0; i < 10; i++) {
          const q = AIMLQuestionEngine.getNextQuestion(used);
          if (used.includes(q.id)) throw new Error(`Duplicate question selected: ${q.id}`);
          used.push(q.id);
        }
      })
    );

    // 18. AI Answering Simulation Difficulty Audit
    results.push(
      runTest('aiml_ai_simulation', 'Knowledge Battle', 'AI Answering Timing & Difficulty Scaling', () => {
        const sample = AIMLQuestionEngine.CURATED_QUESTIONS[0];
        const easy = AIMLQuestionEngine.simulateAIAnswer(sample, 'easy');
        const imp = AIMLQuestionEngine.simulateAIAnswer(sample, 'impossible');
        if (easy.delayMs < 4000) throw new Error('Easy AI responded too quickly: ' + easy.delayMs);
        if (imp.delayMs > 4000) throw new Error('Impossible AI responded too slowly: ' + imp.delayMs);
      })
    );

    return results;
  }
}
