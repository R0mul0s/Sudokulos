/**
 * Testy statsStore — záznamy, agregáty per obtížnost, celkem, streak.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  computeDifficultyStats,
  computeOverallStats,
  computeStreak,
  useStatsStore,
  type GameRecord,
  STATS_HISTORY_LIMIT,
} from './statsStore';

function record(overrides: Partial<GameRecord> = {}): GameRecord {
  return {
    finishedAt: new Date().toISOString(),
    difficulty: 'easy',
    mode: 'classic',
    outcome: 'completed',
    timeMs: 120_000,
    mistakes: 0,
    hintsUsed: 0,
    ...overrides,
  };
}

describe('statsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useStatsStore.getState().clearAll();
  });

  it('recordGame přidá záznam do historie', () => {
    useStatsStore.getState().recordGame(record());
    expect(useStatsStore.getState().history).toHaveLength(1);
  });

  it('clearAll vymaže historii', () => {
    useStatsStore.getState().recordGame(record());
    useStatsStore.getState().clearAll();
    expect(useStatsStore.getState().history).toHaveLength(0);
  });

  it('udržuje maximálně STATS_HISTORY_LIMIT záznamů', () => {
    const store = useStatsStore.getState();
    for (let i = 0; i < STATS_HISTORY_LIMIT + 10; i++) {
      store.recordGame(record({ timeMs: i * 1000 }));
    }
    expect(useStatsStore.getState().history).toHaveLength(STATS_HISTORY_LIMIT);
    // První záznam by měl být už ten 10., ne úplně první
    expect(useStatsStore.getState().history[0].timeMs).toBe(10_000);
  });

  it('persistuje do localStorage', () => {
    useStatsStore.getState().recordGame(record({ timeMs: 99_000 }));
    const raw = localStorage.getItem('sudoku.stats');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!) as {
      state: { history: Array<{ timeMs: number }> };
    };
    expect(parsed.state.history[0].timeMs).toBe(99_000);
  });
});

describe('computeDifficultyStats', () => {
  it('prázdná historie vrací nuly a null pro časy', () => {
    const stats = computeDifficultyStats([], 'medium');
    expect(stats).toEqual({
      played: 0,
      completed: 0,
      bestTimeMs: null,
      averageTimeMs: null,
    });
  });

  it('počítá best a average jen pro completed hry', () => {
    const history: GameRecord[] = [
      record({ difficulty: 'easy', outcome: 'completed', timeMs: 100_000 }),
      record({ difficulty: 'easy', outcome: 'completed', timeMs: 200_000 }),
      record({ difficulty: 'easy', outcome: 'failed', timeMs: 50_000 }),
      record({ difficulty: 'hard', outcome: 'completed', timeMs: 900_000 }),
    ];
    const easy = computeDifficultyStats(history, 'easy');
    expect(easy.played).toBe(3);
    expect(easy.completed).toBe(2);
    expect(easy.bestTimeMs).toBe(100_000);
    expect(easy.averageTimeMs).toBe(150_000);
  });
});

describe('computeOverallStats', () => {
  it('úspěšnost je poměr completed ku všem hrám', () => {
    const history: GameRecord[] = [
      record({ outcome: 'completed' }),
      record({ outcome: 'completed' }),
      record({ outcome: 'failed' }),
      record({ outcome: 'failed' }),
    ];
    const s = computeOverallStats(history);
    expect(s.played).toBe(4);
    expect(s.completed).toBe(2);
    expect(s.successRate).toBe(0.5);
  });

  it('prázdná historie má rate 0 (ne NaN)', () => {
    expect(computeOverallStats([]).successRate).toBe(0);
  });
});

describe('computeStreak', () => {
  it('prázdná historie = 0', () => {
    expect(computeStreak([])).toBe(0);
  });

  it('jen failed hry nepočítá', () => {
    const history: GameRecord[] = [
      record({ outcome: 'failed', finishedAt: new Date().toISOString() }),
    ];
    expect(computeStreak(history)).toBe(0);
  });

  it('dohraná hra dnes = streak 1', () => {
    const history: GameRecord[] = [
      record({ outcome: 'completed', finishedAt: new Date().toISOString() }),
    ];
    expect(computeStreak(history)).toBe(1);
  });

  it('po sobě jdoucí dny s completed = delší streak', () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const dayBefore = new Date(today);
    dayBefore.setDate(today.getDate() - 2);

    const history: GameRecord[] = [
      record({ outcome: 'completed', finishedAt: dayBefore.toISOString() }),
      record({ outcome: 'completed', finishedAt: yesterday.toISOString() }),
      record({ outcome: 'completed', finishedAt: today.toISOString() }),
    ];
    expect(computeStreak(history)).toBe(3);
  });

  it('pokud chybí dnešek, streak je 0', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const history: GameRecord[] = [
      record({ outcome: 'completed', finishedAt: yesterday.toISOString() }),
    ];
    expect(computeStreak(history)).toBe(0);
  });
});
