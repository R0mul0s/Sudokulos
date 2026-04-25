/**
 * Obrazovka statistik — taby Klasika / Killer / RPG.
 * Klasika a Killer ukazují agregované statistiky z gameStore historie;
 * RPG tab ukazuje meta progress (souls, runy, per-class win rate, best run).
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { useMemo, useState } from 'react';
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
import { useProfileStore } from '@/store/profileStore';
import { AVAILABLE_CLASSES } from '@/store/runStore';
import { formatElapsed } from './format';

interface StatsScreenProps {
  onClose: () => void;
}

type StatsTab = 'classic' | 'killer' | 'rpg';

const AVAILABLE_TABS: readonly StatsTab[] = ['classic', 'killer', 'rpg'];

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

function ClassicStats({ tab }: { tab: 'classic' | 'killer' }) {
  const { t, i18n } = useTranslation();
  const history = useStatsStore((s) => s.history);
  const filteredHistory = useMemo(
    () => history.filter((r) => r.mode === tab),
    [history, tab],
  );
  const overall = useMemo(
    () => computeOverallStats(filteredHistory),
    [filteredHistory],
  );
  const streak = useMemo(
    () => computeStreak(filteredHistory),
    [filteredHistory],
  );
  const perDifficulty = useMemo(
    () =>
      DIFFICULTY_ORDER.map((difficulty) => ({
        difficulty,
        stats: computeDifficultyStats(filteredHistory, difficulty),
      })),
    [filteredHistory],
  );

  const successPercent = new Intl.NumberFormat(i18n.language, {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(overall.successRate);

  return (
    <>
      <section className="grid grid-cols-3 gap-2">
        <StatTile label={t('stats.played')} value={String(overall.played)} />
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
    </>
  );
}

function RpgStats() {
  const { t, i18n } = useTranslation();
  const profile = useProfileStore((s) => s.profile);
  const winRate =
    profile.totalRuns > 0 ? profile.runsWon / profile.totalRuns : 0;
  const winRatePercent = new Intl.NumberFormat(i18n.language, {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(winRate);

  return (
    <>
      <section className="grid grid-cols-3 gap-2">
        <StatTile label={t('stats.rpg.souls')} value={`🪙 ${profile.souls}`} />
        <StatTile
          label={t('stats.rpg.runs')}
          value={String(profile.totalRuns)}
        />
        <StatTile
          label={t('stats.rpg.wins')}
          value={String(profile.runsWon)}
          hint={profile.totalRuns > 0 ? winRatePercent : '—'}
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">
          {t('stats.rpg.byClass')}
        </h2>
        {AVAILABLE_CLASSES.map((cls) => {
          const stats = profile.perClassRuns[cls];
          const played = stats?.played ?? 0;
          const won = stats?.won ?? 0;
          const isUnlocked = profile.unlockedClasses.includes(cls);
          return (
            <div
              key={cls}
              className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm dark:bg-slate-800"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{t(`rpg.class.${cls}.icon`)}</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {!isUnlocked && '🔒 '}
                  {t(`rpg.class.${cls}.name`)}
                </span>
              </div>
              <span className="font-mono text-sm text-slate-700 dark:text-slate-300">
                {won} / {played}
              </span>
            </div>
          );
        })}
      </section>

      {profile.bestRun && (
        <section className="flex flex-col gap-2 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800">
          <h2 className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">
            {t('stats.rpg.bestRun')}
          </h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-900 dark:text-slate-100">
              {t(`rpg.class.${profile.bestRun.characterClass}.name`)} —{' '}
              {profile.bestRun.won
                ? t('stats.rpg.bestRunWon')
                : t('stats.rpg.bestRunReached', {
                    completed: profile.bestRun.levelsCompleted,
                  })}
            </span>
            <span className="font-mono text-sm text-slate-700 dark:text-slate-300">
              {formatElapsed(profile.bestRun.elapsedMs)}
            </span>
          </div>
        </section>
      )}
    </>
  );
}

export function StatsScreen({ onClose }: StatsScreenProps) {
  const { t } = useTranslation();
  const history = useStatsStore((s) => s.history);
  const clearAll = useStatsStore((s) => s.clearAll);
  const [tab, setTab] = useState<StatsTab>('classic');

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

      <div className="grid grid-cols-3 gap-2">
        {AVAILABLE_TABS.map((tabId) => {
          const selected = tab === tabId;
          return (
            <button
              key={tabId}
              type="button"
              onClick={() => setTab(tabId)}
              aria-pressed={selected}
              className={[
                'rounded-xl px-3 py-2 text-sm font-medium shadow-sm transition',
                selected
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100',
              ].join(' ')}
            >
              {tabId === 'rpg' ? t('rpg.menuTitle') : t(`mode.${tabId}`)}
            </button>
          );
        })}
      </div>

      {tab === 'rpg' ? <RpgStats /> : <ClassicStats tab={tab as 'classic' | 'killer'} />}

      {tab !== 'rpg' && history.length > 0 && (
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
