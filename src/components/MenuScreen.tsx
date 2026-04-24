/**
 * Úvodní obrazovka — výběr herního módu + obtížnosti, Continue pro
 * rozehranou hru, odkazy do nastavení a statistik.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Difficulty, GameMode } from '@/types/game';
import { DIFFICULTY_ORDER } from '@/game/difficulty';
import { useGameStore } from '@/store/gameStore';
import { InstallBanner } from './InstallBanner';
import { LanguageSwitcher } from './LanguageSwitcher';
import { formatElapsed } from './format';

interface MenuScreenProps {
  onOpenSettings: () => void;
  onOpenStats: () => void;
}

const AVAILABLE_MODES: readonly GameMode[] = ['classic', 'killer'];

export function MenuScreen({ onOpenSettings, onOpenStats }: MenuScreenProps) {
  const { t } = useTranslation();
  const board = useGameStore((s) => s.board);
  const difficulty = useGameStore((s) => s.difficulty);
  const savedMode = useGameStore((s) => s.mode);
  const elapsedMs = useGameStore((s) => s.elapsedMs);
  const startNewGame = useGameStore((s) => s.startNewGame);
  const continueGame = useGameStore((s) => s.continueGame);
  const [mode, setMode] = useState<GameMode>('classic');
  const [generating, setGenerating] = useState<Difficulty | null>(null);

  const hasSavedGame = board !== null;

  const handlePick = (d: Difficulty) => {
    setGenerating(d);
    requestAnimationFrame(() => {
      startNewGame(d, mode);
      setGenerating(null);
    });
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {t('app.title')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t('app.subtitle')}
          </p>
        </div>
        <LanguageSwitcher />
      </header>

      {hasSavedGame && (
        <button
          type="button"
          onClick={continueGame}
          className="flex flex-col items-start gap-1 rounded-2xl bg-slate-900 px-4 py-3 text-left text-white shadow-sm transition active:scale-[0.98] dark:bg-slate-100 dark:text-slate-900"
        >
          <span className="text-base font-semibold">{t('menu.continue')}</span>
          <span className="text-xs text-slate-300 dark:text-slate-600">
            {t('menu.gameInProgress', {
              mode: t(`mode.${savedMode}`),
              difficulty: t(`difficulty.${difficulty}`),
              time: formatElapsed(elapsedMs),
            })}
          </span>
        </button>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">
          {t('menu.chooseMode')}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {AVAILABLE_MODES.map((m) => {
            const selected = mode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={selected}
                className={[
                  'rounded-2xl px-4 py-3 text-sm font-medium shadow-sm transition active:scale-[0.98]',
                  selected
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'border border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100',
                ].join(' ')}
              >
                {t(`mode.${m}`)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">
          {t('menu.chooseDifficulty')}
        </h2>
        <div className="flex flex-col gap-2">
          {DIFFICULTY_ORDER.map((d) => {
            const isBusy = generating === d;
            return (
              <button
                key={d}
                type="button"
                disabled={generating !== null}
                onClick={() => handlePick(d)}
                className={[
                  'rounded-2xl border border-slate-300 bg-white px-4 py-3',
                  'text-slate-900 shadow-sm transition active:scale-[0.98] disabled:opacity-60',
                  'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100',
                ].join(' ')}
              >
                {isBusy ? t('game.generating') : t(`difficulty.${d}`)}
              </button>
            );
          })}
        </div>
      </div>

      <InstallBanner />

      <div className="flex gap-4 text-sm text-slate-600 dark:text-slate-400">
        <button
          type="button"
          onClick={onOpenStats}
          className="underline-offset-4 hover:underline"
        >
          📊 {t('menu.stats')}
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          className="underline-offset-4 hover:underline"
        >
          ⚙ {t('menu.settings')}
        </button>
      </div>
    </div>
  );
}
