/**
 * Obrazovka statistik — overall metriky, per-obtížnost, streak a reset.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Difficulty } from '@/types/game';
import { DIFFICULTY_ORDER } from '@/game/difficulty';
import {
  computeDifficultyStats,
  computeOverallStats,
  computeStreak,
  useStatsStore,
  type DifficultyStats,
} from '@/store/statsStore';
import { formatElapsed } from './format';

interface StatsScreenProps {
  onClose: () => void;
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-white px-4 py-3 shadow-sm dark:bg-slate-800">
      <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </span>
      {hint !== undefined && (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </span>
      )}
    </div>
  );
}

function DifficultyRow({
  difficulty,
  stats,
}: {
  difficulty: Difficulty;
  stats: DifficultyStats;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800">
      <div className="flex items-center justify-between">
        <span className="font-medium text-slate-900 dark:text-slate-100">
          {t(`difficulty.${difficulty}`)}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {t('stats.playedValue', { count: stats.played })}
        </span>
      </div>
      <dl className="grid grid-cols-3 gap-2 text-center">
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t('stats.completed')}
          </dt>
          <dd className="font-mono text-sm text-slate-900 dark:text-slate-100">
            {stats.completed}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t('stats.bestTime')}
          </dt>
          <dd className="font-mono text-sm text-slate-900 dark:text-slate-100">
            {stats.bestTimeMs !== null
              ? formatElapsed(stats.bestTimeMs)
              : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t('stats.averageTime')}
          </dt>
          <dd className="font-mono text-sm text-slate-900 dark:text-slate-100">
            {stats.averageTimeMs !== null
              ? formatElapsed(stats.averageTimeMs)
              : '—'}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function StatsScreen({ onClose }: StatsScreenProps) {
  const { t, i18n } = useTranslation();
  const history = useStatsStore((s) => s.history);
  const clearAll = useStatsStore((s) => s.clearAll);

  const overall = useMemo(() => computeOverallStats(history), [history]);
  const streak = useMemo(() => computeStreak(history), [history]);
  const perDifficulty = useMemo(
    () =>
      DIFFICULTY_ORDER.map((difficulty) => ({
        difficulty,
        stats: computeDifficultyStats(history, difficulty),
      })),
    [history],
  );

  const successPercent = new Intl.NumberFormat(i18n.language, {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(overall.successRate);

  const handleClear = () => {
    if (window.confirm(t('stats.confirmClear'))) {
      clearAll();
    }
  };

  return (
    <div className="flex w-full flex-col gap-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {t('stats.title')}
        </h1>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white dark:bg-slate-100 dark:text-slate-900"
        >
          {t('stats.close')}
        </button>
      </header>

      <section className="grid grid-cols-3 gap-2">
        <StatTile
          label={t('stats.played')}
          value={String(overall.played)}
        />
        <StatTile
          label={t('stats.successRate')}
          value={overall.played > 0 ? successPercent : '—'}
          hint={t('stats.completedOutOfPlayed', {
            completed: overall.completed,
            played: overall.played,
          })}
        />
        <StatTile
          label={t('stats.streak')}
          value={String(streak)}
          hint={streak === 1 ? t('stats.dayOne') : t('stats.dayMany')}
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">
          {t('stats.byDifficulty')}
        </h2>
        {perDifficulty.map(({ difficulty, stats }) => (
          <DifficultyRow
            key={difficulty}
            difficulty={difficulty}
            stats={stats}
          />
        ))}
      </section>

      {history.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          className="self-start text-sm text-red-600 underline-offset-4 hover:underline"
        >
          {t('stats.clear')}
        </button>
      )}
    </div>
  );
}
