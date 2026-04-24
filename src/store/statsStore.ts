/**
 * Statistiky dohraných her — persistovaný Zustand store.
 * Ukládá historii jednotlivých her a poskytuje odvozené agregáty
 * (úspěšnost, průměrný/nejlepší čas per obtížnost, streak).
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Difficulty, GameMode } from '@/types/game';

export type GameOutcome = 'completed' | 'failed';

export interface GameRecord {
  /** ISO timestamp konce hry. */
  finishedAt: string;
  difficulty: Difficulty;
  mode: GameMode;
  outcome: GameOutcome;
  timeMs: number;
  mistakes: number;
  hintsUsed: number;
}

export interface DifficultyStats {
  played: number;
  completed: number;
  bestTimeMs: number | null;
  averageTimeMs: number | null;
}

/** Maximální počet záznamů, které v historii držíme (starší se zahazují). */
export const STATS_HISTORY_LIMIT = 500;

interface StatsState {
  history: GameRecord[];
}

interface StatsActions {
  recordGame: (record: GameRecord) => void;
  clearAll: () => void;
}

export type StatsStore = StatsState & StatsActions;

export const useStatsStore = create<StatsStore>()(
  persist(
    (set) => ({
      history: [],
      recordGame: (record) => {
        set((state) => {
          const next = [...state.history, record];
          if (next.length > STATS_HISTORY_LIMIT) {
            next.splice(0, next.length - STATS_HISTORY_LIMIT);
          }
          return { history: next };
        });
      },
      clearAll: () => set({ history: [] }),
    }),
    {
      name: 'sudoku.stats',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

/**
 * Spočítá souhrn statistik pro konkrétní obtížnost.
 */
export function computeDifficultyStats(
  history: readonly GameRecord[],
  difficulty: Difficulty,
): DifficultyStats {
  const forDifficulty = history.filter((r) => r.difficulty === difficulty);
  const completedGames = forDifficulty.filter((r) => r.outcome === 'completed');

  let bestTimeMs: number | null = null;
  let sumTime = 0;
  for (const r of completedGames) {
    if (bestTimeMs === null || r.timeMs < bestTimeMs) bestTimeMs = r.timeMs;
    sumTime += r.timeMs;
  }

  return {
    played: forDifficulty.length,
    completed: completedGames.length,
    bestTimeMs,
    averageTimeMs:
      completedGames.length > 0 ? Math.round(sumTime / completedGames.length) : null,
  };
}

/** Souhrn napříč všemi obtížnostmi. */
export function computeOverallStats(history: readonly GameRecord[]): {
  played: number;
  completed: number;
  successRate: number;
} {
  const completed = history.filter((r) => r.outcome === 'completed').length;
  return {
    played: history.length,
    completed,
    successRate: history.length > 0 ? completed / history.length : 0,
  };
}

/** Lokální YYYY-MM-DD klíč (bez timezone posunů z toISOString). */
function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Počet po sobě jdoucích kalendářních dnů (ode dneška dozadu), kdy byla
 * dohraná alespoň jedna hra (completed). Dnešek se započítává jen pokud
 * už dnes byla hra. Pracuje v lokální timezone, ne UTC.
 */
export function computeStreak(history: readonly GameRecord[]): number {
  const daysWithCompletion = new Set<string>();
  for (const r of history) {
    if (r.outcome !== 'completed') continue;
    daysWithCompletion.add(toLocalDateKey(new Date(r.finishedAt)));
  }
  if (daysWithCompletion.size === 0) return 0;

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (daysWithCompletion.has(toLocalDateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
