import {
  Achievement,
  AudioSettings,
  DailyChallenge,
  MatchRecord,
  PlayerStats,
  ThemeId,
} from '../types/game';

const SCHEMA_VERSION = 1;
const STORAGE_KEY = 'beyond_the_grid_save_v1';

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_victory',
    title: 'First Blood',
    description: 'Claim your very first victory in any game mode.',
    icon: '⚔️',
    category: 'gameplay',
    xpReward: 100,
    isUnlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'first_draw',
    title: 'Stalemate Strategist',
    description: 'Battle to a hard-fought draw against any opponent.',
    icon: '🤝',
    category: 'gameplay',
    xpReward: 75,
    isUnlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'ten_matches',
    title: 'Veteran Gridder',
    description: 'Complete 10 total matches on the platform.',
    icon: '🛡️',
    category: 'gameplay',
    xpReward: 200,
    isUnlocked: false,
    progress: 0,
    maxProgress: 10,
  },
  {
    id: 'five_wins',
    title: 'Contender',
    description: 'Win 5 matches across any game modes.',
    icon: '🥉',
    category: 'skill',
    xpReward: 250,
    isUnlocked: false,
    progress: 0,
    maxProgress: 5,
  },
  {
    id: 'ten_wins',
    title: 'Decathlete',
    description: 'Rack up 10 victories on the grid.',
    icon: '🥈',
    category: 'skill',
    xpReward: 500,
    isUnlocked: false,
    progress: 0,
    maxProgress: 10,
  },
  {
    id: 'winning_streak_3',
    title: 'On Fire',
    description: 'Achieve a consecutive win streak of 3 matches.',
    icon: '🔥',
    category: 'skill',
    xpReward: 300,
    isUnlocked: false,
    progress: 0,
    maxProgress: 3,
  },
  {
    id: 'impossible_challenger',
    title: 'God Slayer',
    description: 'Secure a draw or victory against the Impossible Minimax AI.',
    icon: '👑',
    category: 'skill',
    xpReward: 750,
    isUnlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'ultimate_champion',
    title: 'Macro Tactician',
    description: 'Win an Ultimate Tic Tac Toe 9x9 match.',
    icon: '🌌',
    category: 'modes',
    xpReward: 400,
    isUnlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'puzzle_prodigy',
    title: 'Puzzle Prodigy',
    description: 'Successfully solve 5 tactical challenge puzzles.',
    icon: '🧩',
    category: 'skill',
    xpReward: 350,
    isUnlocked: false,
    progress: 0,
    maxProgress: 5,
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Win a Time Attack match with more than 50% timer remaining.',
    icon: '⚡',
    category: 'modes',
    xpReward: 300,
    isUnlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'power_surge',
    title: 'Power Surge',
    description: 'Activate 5 strategic power-ups during gameplay.',
    icon: '✨',
    category: 'gameplay',
    xpReward: 200,
    isUnlocked: false,
    progress: 0,
    maxProgress: 5,
  },
  {
    id: 'iron_survivor',
    title: 'Iron Survivor',
    description: 'Survive 3 consecutive escalating rounds in Survival Mode.',
    icon: '🧗',
    category: 'modes',
    xpReward: 450,
    isUnlocked: false,
    progress: 0,
    maxProgress: 3,
  },
];

export interface AppSaveData {
  version: number;
  stats: PlayerStats;
  achievements: Achievement[];
  matchHistory: MatchRecord[];
  dailyChallenges: DailyChallenge[];
  lastDailyDate: string;
  theme: ThemeId;
  playerName: string;
  playerAvatar: string;
  audioSettings: AudioSettings;
  reducedMotion: boolean;
  unlockedSkins: string[];
  claimedRewardKeys: string[];
}

export class StorageManager {
  private static defaultData: AppSaveData = {
    version: SCHEMA_VERSION,
    stats: {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalXP: 0,
      currentLevel: 1,
      puzzlesSolvedCount: 0,
      survivalBestStreak: 0,
      timeAttackBestTimeSeconds: 0,
      modeBreakdown: {
        classic: { played: 0, won: 0 },
        ultimate: { played: 0, won: 0 },
        larger4: { played: 0, won: 0 },
        larger5: { played: 0, won: 0 },
        time_attack: { played: 0, won: 0 },
        survival: { played: 0, won: 0 },
        mystery: { played: 0, won: 0 },
        emoji: { played: 0, won: 0 },
        challenge: { played: 0, won: 0 },
      },
    },
    achievements: INITIAL_ACHIEVEMENTS,
    matchHistory: [],
    dailyChallenges: [],
    lastDailyDate: '',
    theme: 'midnight_neon',
    playerName: 'Grid Pioneer',
    playerAvatar: '🚀',
    audioSettings: {
      masterVolume: 0.8,
      sfxVolume: 0.9,
      musicVolume: 0.4,
      isMuted: false,
      enableAmbientMusic: false,
    },
    reducedMotion: false,
    unlockedSkins: ['default', 'neon_cyber'],
    claimedRewardKeys: [],
  };

  /**
   * Loads save data with schema validation and safe fallback
   */
  public static load(): AppSaveData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this.defaultData;

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return this.defaultData;

      // Merge with default to guarantee all keys exist
      return {
        ...this.defaultData,
        ...parsed,
        stats: {
          ...this.defaultData.stats,
          ...(parsed.stats || {}),
          modeBreakdown: {
            ...this.defaultData.stats.modeBreakdown,
            ...(parsed.stats?.modeBreakdown || {}),
          },
        },
        achievements: this.mergeAchievements(parsed.achievements || []),
      };
    } catch {
      // Storage corrupted, return defaults gracefully
      return this.defaultData;
    }
  }

  /**
   * Saves data reliably to localStorage
   */
  public static save(data: AppSaveData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  /**
   * Merges persisted achievements with code definitions
   */
  private static mergeAchievements(persisted: Achievement[]): Achievement[] {
    const map = new Map<string, Achievement>();
    persisted.forEach((a) => map.set(a.id, a));

    return INITIAL_ACHIEVEMENTS.map((def) => {
      const existing = map.get(def.id);
      if (!existing) return def;
      return {
        ...def,
        isUnlocked: existing.isUnlocked,
        unlockedAt: existing.unlockedAt,
        progress: existing.progress,
      };
    });
  }

  /**
   * Calculates level from XP curve: Level = 1 + floor((XP / 150) ^ 0.65)
   */
  public static calculateLevel(xp: number): {
    level: number;
    currentLevelXP: number;
    nextLevelXP: number;
    progressPercent: number;
  } {
    let level = 1;
    let required = 150;
    let accumulated = 0;

    while (xp >= accumulated + required) {
      accumulated += required;
      level++;
      required = Math.floor(150 * Math.pow(level, 1.25));
    }

    const currentLevelXP = xp - accumulated;
    const progressPercent = Math.min(100, Math.floor((currentLevelXP / required) * 100));

    return {
      level,
      currentLevelXP,
      nextLevelXP: required,
      progressPercent,
    };
  }

  /**
   * Records a match and idempotently updates statistics, streaks, and match history
   */
  public static recordMatch(match: MatchRecord): {
    updatedData: AppSaveData;
    newAchievements: Achievement[];
    leveledUp: boolean;
  } {
    const data = this.load();

    // Check if match already recorded
    if (data.matchHistory.some((m) => m.id === match.id)) {
      return { updatedData: data, newAchievements: [], leveledUp: false };
    }

    const oldLevel = data.stats.currentLevel;

    // Update stats
    const stats = { ...data.stats };
    stats.totalMatches++;

    if (match.result === 'win') {
      stats.wins++;
      stats.currentStreak++;
      if (stats.currentStreak > stats.bestStreak) {
        stats.bestStreak = stats.currentStreak;
      }
    } else if (match.result === 'loss') {
      stats.losses++;
      stats.currentStreak = 0;
    } else {
      stats.draws++;
    }

    stats.winRate = Math.round((stats.wins / stats.totalMatches) * 100);
    stats.totalXP += match.xpEarned;

    const levelInfo = this.calculateLevel(stats.totalXP);
    stats.currentLevel = levelInfo.level;

    // Update mode breakdown
    if (stats.modeBreakdown[match.mode]) {
      stats.modeBreakdown[match.mode].played++;
      if (match.result === 'win') {
        stats.modeBreakdown[match.mode].won++;
      }
    }

    // Append to match history (cap at 30)
    const history = [match, ...data.matchHistory].slice(0, 30);

    // Evaluate achievements
    const newAchievements: Achievement[] = [];
    const updatedAchievements = data.achievements.map((ach) => {
      if (ach.isUnlocked) return ach;

      let newProgress = ach.progress;
      let unlocked = false;

      switch (ach.id) {
        case 'first_victory':
          if (match.result === 'win') {
            newProgress = 1;
            unlocked = true;
          }
          break;
        case 'first_draw':
          if (match.result === 'draw') {
            newProgress = 1;
            unlocked = true;
          }
          break;
        case 'ten_matches':
          newProgress = stats.totalMatches;
          unlocked = newProgress >= 10;
          break;
        case 'five_wins':
          newProgress = stats.wins;
          unlocked = newProgress >= 5;
          break;
        case 'ten_wins':
          newProgress = stats.wins;
          unlocked = newProgress >= 10;
          break;
        case 'winning_streak_3':
          newProgress = Math.max(ach.progress, stats.currentStreak);
          unlocked = newProgress >= 3;
          break;
        case 'impossible_challenger':
          if (match.aiDifficulty === 'impossible' && (match.result === 'win' || match.result === 'draw')) {
            newProgress = 1;
            unlocked = true;
          }
          break;
        case 'ultimate_champion':
          if (match.mode === 'ultimate' && match.result === 'win') {
            newProgress = 1;
            unlocked = true;
          }
          break;
        default:
          break;
      }

      if (unlocked && !ach.isUnlocked) {
        const completed = {
          ...ach,
          isUnlocked: true,
          unlockedAt: new Date().toISOString(),
          progress: ach.maxProgress,
        };
        newAchievements.push(completed);
        stats.totalXP += ach.xpReward;
        return completed;
      }

      return { ...ach, progress: Math.min(ach.maxProgress, newProgress) };
    });

    const finalLevelInfo = this.calculateLevel(stats.totalXP);
    stats.currentLevel = finalLevelInfo.level;

    const leveledUp = stats.currentLevel > oldLevel;

    const updatedData: AppSaveData = {
      ...data,
      stats,
      matchHistory: history,
      achievements: updatedAchievements,
    };

    this.save(updatedData);

    return { updatedData, newAchievements, leveledUp };
  }

  /**
   * Resets statistics safely without removing settings, themes, or player identity
   */
  public static resetStats(): AppSaveData {
    const current = this.load();
    const resetData: AppSaveData = {
      ...current,
      stats: {
        totalMatches: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalXP: 0,
        currentLevel: 1,
        puzzlesSolvedCount: 0,
        survivalBestStreak: 0,
        timeAttackBestTimeSeconds: 0,
        modeBreakdown: {
          classic: { played: 0, won: 0 },
          ultimate: { played: 0, won: 0 },
          larger4: { played: 0, won: 0 },
          larger5: { played: 0, won: 0 },
          time_attack: { played: 0, won: 0 },
          survival: { played: 0, won: 0 },
          mystery: { played: 0, won: 0 },
          emoji: { played: 0, won: 0 },
          challenge: { played: 0, won: 0 },
        },
      },
      matchHistory: [],
    };
    this.save(resetData);
    return resetData;
  }

  /**
   * Generates or retrieves daily challenges for today's date
   */
  public static getDailyChallenges(): DailyChallenge[] {
    const data = this.load();
    const today = new Date().toISOString().split('T')[0];

    if (data.lastDailyDate === today && data.dailyChallenges.length > 0) {
      return data.dailyChallenges;
    }

    // Deterministic generation for today
    const seed = today.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0);

    const challenges: DailyChallenge[] = [
      {
        id: `daily_${today}_1`,
        date: today,
        title: 'Master the Defense',
        description: 'Achieve victory against Medium AI in Classic 3x3 without using undo.',
        difficulty: 'easy',
        gameMode: 'classic',
        targetCondition: 'win_medium_ai',
        xpReward: 150,
        isCompleted: false,
        claimed: false,
      },
      {
        id: `daily_${today}_2`,
        date: today,
        title: 'Grid Supremacy',
        description: 'Win a match on the 4x4 Extended Grid mode.',
        difficulty: 'medium',
        gameMode: 'larger4',
        targetCondition: 'win_larger4',
        xpReward: 200,
        isCompleted: false,
        claimed: false,
      },
      {
        id: `daily_${today}_3`,
        date: today,
        title: 'Ultimate Architect',
        description: 'Complete an Ultimate Tic Tac Toe match with at least 5 mini-boards claimed.',
        difficulty: 'hard',
        gameMode: 'ultimate',
        targetCondition: 'complete_ultimate',
        xpReward: 300,
        isCompleted: false,
        claimed: false,
      },
    ];

    data.lastDailyDate = today;
    data.dailyChallenges = challenges;
    this.save(data);

    return challenges;
  }
}
