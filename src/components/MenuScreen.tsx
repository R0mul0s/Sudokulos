/**
 * Úvodní obrazovka — nová hra (s volbou obtížnosti) + Continue pokud je
 * rozehraná hra v localStorage + tlačítko do nastavení.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Difficulty } from '@/types/game';
import { DIFFICULTY_ORDER } from '@/game/difficulty';
import { useGameStore } from '@/store/gameStore';
import { InstallBanner } from './InstallBanner';
import { LanguageSwitcher } from './LanguageSwitcher';
import { formatElapsed } from './format';

interface MenuScreenProps {
  onOpenSettings: () => void;
}

export function MenuScreen({ onOpenSettings }: MenuScreenProps) {
  const { t } = useTranslation();
  const board = useGameStore((s) => s.board);
  const difficulty = useGameStore((s) => s.difficulty);
  const elapsedMs = useGameStore((s) => s.elapsedMs);
  const startNewGame = useGameStore((s) => s.startNewGame);
  const continueGame = useGameStore((s) => s.continueGame);
  const [generating, setGenerating] = useState<Difficulty | null>(null);

  const hasSavedGame = board !== null;

  const handlePick = (d: Difficulty) => {
    setGenerating(d);
    requestAnimationFrame(() => {
      startNewGame(d);
      setGenerating(null);
    });
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t('app.title')}
          </h1>
          <p className="text-sm text-slate-600">{t('app.subtitle')}</p>
        </div>
        <LanguageSwitcher />
      </header>

      {hasSavedGame && (
        <button
          type="button"
          onClick={continueGame}
          className="flex flex-col items-start gap-1 rounded-2xl bg-slate-900 px-4 py-3 text-left text-white shadow-sm transition active:scale-[0.98]"
        >
          <span className="text-base font-semibold">{t('menu.continue')}</span>
          <span className="text-xs text-slate-300">
            {t('menu.gameInProgress', {
              difficulty: t(`difficulty.${difficulty}`),
              time: formatElapsed(elapsedMs),
            })}
          </span>
        </button>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-600">
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
                ].join(' ')}
              >
                {isBusy ? t('game.generating') : t(`difficulty.${d}`)}
              </button>
            );
          })}
        </div>
      </div>

      <InstallBanner />

      <button
        type="button"
        onClick={onOpenSettings}
        className="self-start text-sm text-slate-600 underline-offset-4 hover:underline"
      >
        ⚙ {t('menu.settings')}
      </button>
    </div>
  );
}
