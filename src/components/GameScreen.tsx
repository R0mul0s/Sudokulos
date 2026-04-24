/**
 * Hlavní herní obrazovka — deska, ovládání, pauza, obrazovka dokončení a prohry.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useGameTimer } from '@/hooks/useGameTimer';
import { useKeyboardControls } from '@/hooks/useKeyboardControls';
import { Board } from './Board';
import { Controls } from './Controls';
import { NumberPad } from './NumberPad';
import { Timer } from './Timer';
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

  useGameTimer();
  useKeyboardControls();

  const showCompleted = status === 'completed';
  const showFailed = status === 'failed';
  const showOverlay = showCompleted || showFailed;

  return (
    <div className="flex w-full flex-col gap-4">
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={returnToMenu}
          className="text-sm text-slate-600 underline-offset-4 hover:underline"
        >
          ← {t('game.backToMenu')}
        </button>
        <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
          {t(`difficulty.${difficulty}`)}
        </span>
      </header>

      <Timer />

      <div className="relative">
        <Board />
        {status === 'paused' && (
          <div className="absolute inset-0 flex items-center justify-center rounded-md bg-white/90 backdrop-blur-sm">
            <button
              type="button"
              onClick={resume}
              className="rounded-2xl bg-slate-900 px-6 py-3 text-white shadow-sm"
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
          className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/60 modal-safe-area"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-3xl bg-white p-6 text-center shadow-xl">
            <h2
              className={[
                'text-2xl font-semibold',
                showFailed ? 'text-red-600' : 'text-slate-900',
              ].join(' ')}
            >
              {showCompleted ? t('game.completed') : t('game.failed')}
            </h2>
            {showFailed && maxMistakes > 0 && (
              <p className="text-sm text-slate-600">
                {t('game.failedDescription', { max: maxMistakes })}
              </p>
            )}
            <dl className="flex justify-around text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">
                  {t('game.yourTime')}
                </dt>
                <dd className="font-mono text-xl text-slate-900">
                  {formatElapsed(elapsedMs)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">
                  {t('game.mistakes')}
                </dt>
                <dd className="font-mono text-xl text-slate-900">{mistakes}</dd>
              </div>
              {hintsUsed > 0 && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    {t('game.hintsUsed')}
                  </dt>
                  <dd className="font-mono text-xl text-slate-900">
                    {hintsUsed}
                  </dd>
                </div>
              )}
            </dl>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={returnToMenu}
                className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
              >
                {t('game.backToMenu')}
              </button>
              <button
                type="button"
                onClick={() => startNewGame(difficulty)}
                className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-white"
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
