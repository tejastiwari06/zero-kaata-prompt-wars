export type PlayerSymbol = 'X' | 'O' | string;

export type CellState = PlayerSymbol | null;

export type BoardSize = 3 | 4 | 5;

export type GameMode = 
  | 'classic'
  | 'ultimate'
  | 'larger4'
  | 'larger5'
  | 'time_attack'
  | 'survival'
  | 'mystery'
  | 'emoji'
  | 'challenge';

export type OpponentType = 'human_local' | 'ai' | 'online_peer';

export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'impossible';

export type AIPersonalityId = 
  | 'strategist' 
  | 'trickster' 
  | 'guardian' 
  | 'speedster' 
  | 'grandmaster';

export interface AIPersonality {
  id: AIPersonalityId;
  name: string;
  avatar: string;
  title: string;
  description: string;
  quips: {
    greeting: string[];
    winning: string[];
    losing: string[];
    neutral: string[];
    thinking: string[];
  };
  reactionSpeedMs: number;
}

export type PowerUpType = 
  | 'undo' 
  | 'eraser' 
  | 'shield' 
  | 'swap' 
  | 'hint' 
  | 'freeze' 
  | 'double_move';

export interface PowerUpDefinition {
  type: PowerUpType;
  name: string;
  icon: string;
  description: string;
  cost: number;
  maxPerMatch: number;
  requiresTarget: boolean;
  targetType?: 'empty' | 'own_occupied' | 'opponent_occupied' | 'any_occupied' | 'none';
}

export interface ShieldInfo {
  cellIndex: number;
  symbol: PlayerSymbol;
  expiresInTurns: number;
}

export interface FrozenCellInfo {
  cellIndex: number;
  frozenBy: PlayerSymbol;
  expiresInTurns: number;
}

export interface PowerUpInventory {
  [key: string]: number; // remaining count for each PowerUpType
}

export interface WinningLine {
  indices: number[];
  direction: 'horizontal' | 'vertical' | 'diagonal_main' | 'diagonal_anti';
}

export type GameStatus = 'idle' | 'playing' | 'won' | 'draw';

export interface MoveRecord {
  step: number;
  index: number;
  symbol: PlayerSymbol;
  playerRole: 'player1' | 'player2' | 'ai';
  timestamp: number;
  boardSnapshot: CellState[];
  powerUpUsed?: PowerUpType;
  note?: string;
}

export interface UltimateBoardState {
  // 9 mini boards, each with 9 cells
  boards: CellState[][];
  // Status of each of the 9 mini boards: 'X' | 'O' | 'draw' | null
  boardWins: (PlayerSymbol | 'draw' | null)[];
  // Next active mini board index (0-8), or null for free choice
  activeBoardIndex: number | null;
  // Overall macro board winner
  overallWinner: PlayerSymbol | 'draw' | null;
  // Winning macro lines
  winningMacroLine: number[] | null;
  // Winning mini board lines
  miniWinningLines: (number[] | null)[];
}

export interface TacticalOpportunity {
  step: number;
  type: 'missed_win' | 'missed_block' | 'fork_created' | 'fork_conceded' | 'suboptimal';
  cellIndex: number;
  explanation: string;
}

export interface MatchAnalysis {
  matchId: string;
  totalMoves: number;
  durationMs: number;
  accuracyScore: number; // 0 to 100 calculated from optimal vs suboptimal moves
  opportunities: TacticalOpportunity[];
  summaryInsights: string[];
}

export interface MatchRecord {
  id: string;
  date: string;
  mode: GameMode;
  boardSize: number;
  opponentType: OpponentType;
  aiDifficulty?: AIDifficulty;
  aiPersonality?: AIPersonalityId;
  playerSymbol: PlayerSymbol;
  opponentSymbol: PlayerSymbol;
  result: 'win' | 'loss' | 'draw';
  movesCount: number;
  durationSeconds: number;
  moves: MoveRecord[];
  finalBoard: CellState[];
  winningLine?: WinningLine | null;
  analysis?: MatchAnalysis;
  xpEarned: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'gameplay' | 'skill' | 'modes' | 'collection';
  xpReward: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
}

export interface DailyChallenge {
  id: string;
  date: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  gameMode: GameMode;
  targetCondition: string;
  xpReward: number;
  isCompleted: boolean;
  claimed: boolean;
}

export interface TacticalPuzzle {
  id: string;
  title: string;
  objective: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'master';
  boardSize: 3;
  initialBoard: CellState[];
  playerSymbol: PlayerSymbol;
  opponentSymbol: PlayerSymbol;
  optimalMoves: number[]; // winning or blocking correct sequence of square indices
  hintText: string;
  explanation: string;
  xpReward: number;
}

export interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  totalXP: number;
  currentLevel: number;
  puzzlesSolvedCount: number;
  survivalBestStreak: number;
  timeAttackBestTimeSeconds: number;
  modeBreakdown: Record<GameMode, { played: number; won: number }>;
}

export type ThemeId = 
  | 'midnight_neon'
  | 'minimal_light'
  | 'cyberpunk'
  | 'retro_arcade'
  | 'cosmic_space'
  | 'nature'
  | 'monochrome'
  | 'custom';

export interface CustomThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
}

export interface SymbolPack {
  id: string;
  name: string;
  player1: string;
  player2: string;
  isUnlocked: boolean;
  unlockLevel: number;
}

export interface AudioSettings {
  masterVolume: number; // 0.0 to 1.0
  sfxVolume: number;
  musicVolume: number;
  isMuted: boolean;
  enableAmbientMusic: boolean;
}

export interface MysteryModifier {
  id: string;
  name: string;
  description: string;
  icon: string;
  restrictedCells?: number[];
  fogOfWar?: boolean;
  bonusXPMultiplier?: number;
}

export interface AIMLQuestionData {
  id: string;
  topic: string;
  difficulty: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

export interface MovePermission {
  playerId: string;
  playerSymbol: string;
  grantedAt: number;
  consumed: boolean;
  questionId: string;
}

