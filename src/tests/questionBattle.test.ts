import { describe, expect, it } from 'vitest';
import { AIMLQuestionEngine } from '../engine/AIMLQuestionEngine';

describe('AI/ML Knowledge Battle Engine', () => {
  it('validates all curated questions for 4 options and valid answer key', () => {
    expect(AIMLQuestionEngine.CURATED_QUESTIONS.length).toBeGreaterThanOrEqual(20);

    for (const q of AIMLQuestionEngine.CURATED_QUESTIONS) {
      expect(AIMLQuestionEngine.validateQuestion(q)).toBe(true);
      expect(['A', 'B', 'C', 'D']).toContain(q.answer);
      expect(q.options.A).toBeTruthy();
      expect(q.options.B).toBeTruthy();
      expect(q.options.C).toBeTruthy();
      expect(q.options.D).toBeTruthy();
      // Ensure options are distinct
      const uniqueOpts = new Set([q.options.A, q.options.B, q.options.C, q.options.D]);
      expect(uniqueOpts.size).toBe(4);
    }
  });

  it('guarantees unique questions and avoids repetition with used IDs', () => {
    const usedIds: string[] = [];
    const count = 15;

    for (let i = 0; i < count; i++) {
      const q = AIMLQuestionEngine.getNextQuestion(usedIds);
      expect(usedIds).not.toContain(q.id);
      usedIds.push(q.id);
      expect(AIMLQuestionEngine.validateQuestion(q)).toBe(true);
    }

    expect(usedIds.length).toBe(count);
    const uniqueIds = new Set(usedIds);
    expect(uniqueIds.size).toBe(count);
  });

  it('procedurally generates questions when curated bank is exhausted', () => {
    // Fill used IDs with all curated question IDs
    const allCuratedIds = AIMLQuestionEngine.CURATED_QUESTIONS.map(q => q.id);
    const procQ = AIMLQuestionEngine.getNextQuestion(allCuratedIds);

    expect(procQ).toBeDefined();
    expect(allCuratedIds).not.toContain(procQ.id);
    expect(AIMLQuestionEngine.validateQuestion(procQ)).toBe(true);
  });

  it('shuffleOptions preserves the correct text answer regardless of key position', () => {
    const base = AIMLQuestionEngine.CURATED_QUESTIONS[0];
    const correctText = base.options[base.answer];

    for (let i = 0; i < 20; i++) {
      const shuffled = AIMLQuestionEngine.shuffleOptions(base);
      expect(shuffled.options[shuffled.answer]).toBe(correctText);
      expect(['A', 'B', 'C', 'D']).toContain(shuffled.answer);
    }
  });

  it('simulates AI response with appropriate accuracy and timing per difficulty', () => {
    const sample = AIMLQuestionEngine.CURATED_QUESTIONS[1];

    // Easy AI: slower (>= 4500ms)
    const easyResp = AIMLQuestionEngine.simulateAIAnswer(sample, 'easy');
    expect(easyResp.delayMs).toBeGreaterThanOrEqual(4500);
    expect(['A', 'B', 'C', 'D']).toContain(easyResp.option);

    // Impossible AI: fast (<= 3500ms)
    const impossibleResp = AIMLQuestionEngine.simulateAIAnswer(sample, 'impossible');
    expect(impossibleResp.delayMs).toBeLessThanOrEqual(3500);
    expect(['A', 'B', 'C', 'D']).toContain(impossibleResp.option);
  });
});

