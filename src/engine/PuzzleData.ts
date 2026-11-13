import { TacticalPuzzle } from '../types/game';

export const TACTICAL_PUZZLES: TacticalPuzzle[] = [
  {
    id: 'puzzle_1',
    title: 'Precision Strike',
    objective: 'Deliver the finishing blow in a single move.',
    difficulty: 'beginner',
    boardSize: 3,
    // [X, X, null,
    //  O, O, null,
    //  null, null, null]
    initialBoard: ['X', 'X', null, 'O', 'O', null, null, null, null],
    playerSymbol: 'X',
    opponentSymbol: 'O',
    optimalMoves: [2],
    hintText: 'Inspect the top row. The horizontal victory corridor is open!',
    explanation: 'Placing your symbol on cell 2 completes the top horizontal triad for an instant victory.',
    xpReward: 100,
  },
  {
    id: 'puzzle_2',
    title: 'Defensive Firewall',
    objective: 'The opponent has an immediate winning threat. Block it now!',
    difficulty: 'beginner',
    boardSize: 3,
    // [O, null, X,
    //  O, X, null,
    //  null, null, null]
    initialBoard: ['O', null, 'X', 'O', 'X', null, null, null, null],
    playerSymbol: 'X',
    opponentSymbol: 'O',
    optimalMoves: [6],
    hintText: 'Look at the leftmost column. Opponent has 0 and 3 aligned.',
    explanation: 'Opponent threatened a column 1 completion on square 6. Playing on 6 shuts down their victory.',
    xpReward: 100,
  },
  {
    id: 'puzzle_3',
    title: 'The Dual Threat Fork',
    objective: 'Create a fork that opens two simultaneous winning threats!',
    difficulty: 'intermediate',
    boardSize: 3,
    // [X, null, null,
    //  null, O, null,
    //  null, null, X]
    // Player is X. If X plays at 2 (top right corner):
    // Threats are 1 (row 0: 0, 1, 2) and 5/8 (col 2: 2, 5, 8).
    // Or if X plays at 6: threats are 3 (col 0: 0, 3, 6) and 7 (row 2: 6, 7, 8).
    initialBoard: ['X', null, null, null, 'O', null, null, null, 'X'],
    playerSymbol: 'X',
    opponentSymbol: 'O',
    optimalMoves: [2, 6],
    hintText: 'Seize one of the unoccupied corner cells to threaten both horizontal and vertical lanes.',
    explanation: 'Playing on cell 2 creates threats along Row 0 and Column 2. Opponent can only block one, securing your win next turn!',
    xpReward: 150,
  },
  {
    id: 'puzzle_4',
    title: 'The Fork Interceptor',
    objective: 'Prevent the opponent from executing a deadly double-corner fork.',
    difficulty: 'intermediate',
    boardSize: 3,
    // [O, null, null,
    //  null, X, null,
    //  null, null, O]
    // Opponent O holds opposite corners 0 and 8. If X plays corner 2 or 6, O takes the other and forks.
    // Optimal counter: X must play an EDGE (1, 3, 5, or 7) forcing O to block rather than fork!
    initialBoard: ['O', null, null, null, 'X', null, null, null, 'O'],
    playerSymbol: 'X',
    opponentSymbol: 'O',
    optimalMoves: [1, 3, 5, 7],
    hintText: 'Avoid playing in a corner! Play on an edge to create a counter-threat and force opponent to respond defensively.',
    explanation: 'Playing on any edge cell (1, 3, 5, 7) creates an active two-in-a-row threat, compelling O to defend rather than establish a lethal fork.',
    xpReward: 175,
  },
  {
    id: 'puzzle_5',
    title: 'Diagonal Guillotine',
    objective: 'Complete the main diagonal before opponent executes their counter-attack.',
    difficulty: 'beginner',
    boardSize: 3,
    // [X, O, null,
    //  O, X, null,
    //  null, null, null]
    initialBoard: ['X', 'O', null, 'O', 'X', null, null, null, null],
    playerSymbol: 'X',
    opponentSymbol: 'O',
    optimalMoves: [8],
    hintText: 'Trace the main diagonal from top-left to bottom-right.',
    explanation: 'Landing on cell 8 connects cells 0, 4, and 8, executing an irresistible diagonal checkmate.',
    xpReward: 120,
  },
  {
    id: 'puzzle_6',
    title: 'The Steel Fortress (Forced Draw)',
    objective: 'Steer an intense endgame into a guaranteed draw against high pressure.',
    difficulty: 'advanced',
    boardSize: 3,
    // [X, O, X,
    //  X, O, null,
    //  O, X, null]
    // Empty cells: 5, 8.
    // If X plays 8, board is [X, O, X, X, O, null, O, X, X] -> col 2 has X, null, X -> threats!
    // But does O threaten anywhere? If X plays 5, X blocks row 1.
    initialBoard: ['X', 'O', 'X', 'X', 'O', null, 'O', 'X', null],
    playerSymbol: 'X',
    opponentSymbol: 'O',
    optimalMoves: [8],
    hintText: 'Look at Column 2 and Row 2. Cell 8 locks down the remaining vectors.',
    explanation: 'Securing cell 8 eliminates opponent line possibilities and guarantees an ironclad draw.',
    xpReward: 200,
  },
  {
    id: 'puzzle_7',
    title: 'Anti-Diagonal Ambush',
    objective: 'Detect the disguised anti-diagonal sequence for the win.',
    difficulty: 'intermediate',
    boardSize: 3,
    // [null, O, X,
    //  O, X, null,
    //  null, null, null]
    initialBoard: [null, 'O', 'X', 'O', 'X', null, null, null, null],
    playerSymbol: 'X',
    opponentSymbol: 'O',
    optimalMoves: [6],
    hintText: 'Trace from top-right (cell 2) through center (cell 4) down to bottom-left.',
    explanation: 'Cell 6 finishes the anti-diagonal line (2, 4, 6) for an instant victory.',
    xpReward: 140,
  },
  {
    id: 'puzzle_8',
    title: 'Grandmaster Triad',
    objective: 'Find the only move that both neutralizes opponent threat and sets up an unblockable win.',
    difficulty: 'master',
    boardSize: 3,
    // [O, null, null,
    //  null, X, O,
    //  X, null, null]
    // O has 0 and 5. X has 4 and 6.
    // If X plays 2: threats are anti-diag (2, 4, 6 - win!), plus row 0 (0, 1, 2)
    initialBoard: ['O', null, null, null, 'X', 'O', 'X', null, null],
    playerSymbol: 'X',
    opponentSymbol: 'O',
    optimalMoves: [2],
    hintText: 'Target cell 2 (top right) to connect with 4 and 6 while suppressing opponent expansion.',
    explanation: 'Cell 2 immediately fulfills the anti-diagonal triumph (2-4-6), clinching the match in one majestic stroke.',
    xpReward: 250,
  },
];
