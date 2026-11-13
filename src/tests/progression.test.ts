import { beforeEach, describe, expect, it } from 'vitest';
import { StorageManager } from '../storage/StorageManager';
import { MatchRecord } from '../types/game';

describe('StorageManager & Progression Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('calculates levels progressively according to XP curve', () => {
    const lvl1 = StorageManager.calculateLevel(50);
    expect(lvl1.level).toBe(1);
    expect(lvl1.currentLevelXP).toBe(50);

    const lvl2 = StorageManager.calculateLevel(200);
    expect(lvl2.level).toBe(2);
  });

  it('records match victory and awards First Blood achievement', () => {
    const match: MatchRecord = {
      id: 'match_test_1',
      date: new Date().toISOString(),
      mode: 'classic',
      boardSize: 3,
      opponentType: 'ai',
      aiDifficulty: 'medium',
      playerSymbol: 'X',
      opponentSymbol: 'O',
      result: 'win',
      movesCount: 5,
      durationSeconds: 12,
      moves: [],
      finalBoard: Array(9).fill(null),
      xpEarned: 100,
    };

    const { updatedData, newAchievements } = StorageManager.recordMatch(match);

    expect(updatedData.stats.wins).toBe(1);
    expect(updatedData.stats.totalMatches).toBe(1);
    expect(updatedData.stats.currentStreak).toBe(1);
    expect(newAchievements.some((a) => a.id === 'first_victory')).toBe(true);

    // Recording same match again must be idempotent and not increment stats
    const duplicate = StorageManager.recordMatch(match);
    expect(duplicate.updatedData.stats.wins).toBe(1);
    expect(duplicate.newAchievements.length).toBe(0);
  });
});
