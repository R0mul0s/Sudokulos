/**
 * Hlavní herní obrazovka — deska, ovládání, pauza, obrazovka dokončení a prohry.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useRunStore } from '@/store/runStore';
import { useGameTimer } from '@/hooks/useGameTimer';
import { useKeyboardControls } from '@/hooks/useKeyboardControls';
import { Board } from './Board';
import { Controls } from './Controls';
import { NumberPad } from './NumberPad';
import { Timer } from './Timer';
import { RunHud } from './rpg/RunHud';
import { formatElapsed } from './format';

export function GameScreen() {
  const { t } = useTranslation();
  const status = useGameStore((s) => s.status);
  const difficulty = useGameStore((s) => s.difficulty);
  const elapsedMs = useGameStore((s) => s.elapsedMs);
  const mistakes = useGameStore((s) => s.mistakes);
  const hintsUsed = useGameStore((s) => s.hintsUsed);
  const returnToMenu = useGameStore((s) => s.returnToMenu);
  const startNewGame = useGameStore((s) => s.startNewGame);
  const resume = useGameStore((s) => s.resume);
  const maxMistakes = useSettingsStore((s) => s.maxMistakes);
  const runActive = useRunStore((s) => s.run !== null);

  useGameTimer();
  useKeyboardControls();

  const showCompleted = status === 'completed';
  const showFailed = status === 'failed';
  // V run módu se completed/failed řeší přes Reward / RunEnd obrazovky,
  // ne přes lokální overlay v puzzle.
  const showOverlay = !runActive && (showCompleted || showFailed);

  return (
    <div className="flex w-full flex-col gap-4">
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={returnToMenu}
          className="text-sm text-slate-600 underline-offset-4 hover:underline dark:text-slate-400"
        >
          ← {t('game.backToMenu')}
        </button>
        <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200">
          {t(`difficulty.${difficulty}`)}
        </span>
      </header>

      {runActive && <RunHud />}

      <Timer />

      <div className="relative">
        <Board />
        {status === 'paused' && (
          <div className="absolute inset-0 flex items-center justify-center rounded-md bg-white/90 backdrop-blur-sm animate-fade-in dark:bg-slate-900/90">
            <button
              type="button"
              onClick={resume}
              className="rounded-2xl bg-slate-900 px-6 py-3 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
            >
              ▶ {t('game.resume')}
            </button>
          </div>
        )}
      </div>

      <NumberPad />
      <Controls />

      {showOverlay && (
        <div
          className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/60 modal-safe-area animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-3xl bg-white p-6 text-center shadow-xl animate-overlay-in dark:bg-slate-800">
            <h2
              className={[
                'text-2xl font-semibold',
                showFailed
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-slate-900 dark:text-slate-100',
              ].join(' ')}
            >
              {showCompleted ? t('game.completed') : t('game.failed')}
            </h2>
            {showFailed && maxMistakes > 0 && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('game.failedDescription', { max: maxMistakes })}
              </p>
            )}
            <dl className="flex justify-around text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t('game.yourTime')}
                </dt>
                <dd className="font-mono text-xl text-slate-900 dark:text-slate-100">
                  {formatElapsed(elapsedMs)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t('game.mistakes')}
                </dt>
                <dd className="font-mono text-xl text-slate-900 dark:text-slate-100">
                  {mistakes}
                </dd>
              </div>
              {hintsUsed > 0 && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t('game.hintsUsed')}
                  </dt>
                  <dd className="font-mono text-xl text-slate-900 dark:text-slate-100">
                    {hintsUsed}
                  </dd>
                </div>
              )}
            </dl>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={returnToMenu}
                className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                {t('game.backToMenu')}
              </button>
              <button
                type="button"
                onClick={() => startNewGame(difficulty)}
                className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-white dark:bg-slate-100 dark:text-slate-900"
              >
                {t('game.newGame')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
