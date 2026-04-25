/**
 * Onboarding modal pro RPG roguelike mód — krátký průvodce klíčovými mechanikami
 * (HP, combo, lucky cells, chain reaction, relics, env effects, souls).
 * Zobrazí se automaticky před prvním runem; lze otevřít kdykoli z RunMapScreen.
 *
 * @author Roman Hlaváček
 * @created 2026-04-25
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface RpgTutorialModalProps {
  open: boolean;
  onClose: () => void;
}

const TUTORIAL_STEP_KEYS = [
  'welcome',
  'hp',
  'lucky',
  'combo',
  'relics',
  'envEffects',
  'souls',
] as const;

type StepKey = (typeof TUTORIAL_STEP_KEYS)[number];

const STEP_EMOJI: Record<StepKey, string> = {
  welcome: '🎮',
  hp: '❤️',
  lucky: '⭐',
  combo: '🔥',
  relics: '🔮',
  envEffects: '🌩️',
  souls: '🪙',
};

export function RpgTutorialModal({ open, onClose }: RpgTutorialModalProps) {
  const { t } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);

  if (!open) return null;

  const isLast = stepIndex === TUTORIAL_STEP_KEYS.length - 1;
  const isFirst = stepIndex === 0;
  const stepKey = TUTORIAL_STEP_KEYS[stepIndex];

  const handleNext = () => {
    if (isLast) {
      setStepIndex(0);
      onClose();
      return;
    }
    setStepIndex(stepIndex + 1);
  };

  const handleSkip = () => {
    setStepIndex(0);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/70 modal-safe-area animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-3xl bg-white p-6 shadow-xl animate-overlay-in dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t('rpg.tutorial.stepLabel', {
              current: stepIndex + 1,
              total: TUTORIAL_STEP_KEYS.length,
            })}
          </span>
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs text-slate-500 underline-offset-4 hover:underline dark:text-slate-400"
          >
            {t('rpg.tutorial.skip')}
          </button>
        </div>

        <div className="flex flex-col items-center gap-3 text-center">
          <div className="text-5xl">{STEP_EMOJI[stepKey]}</div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t(`rpg.tutorial.steps.${stepKey}.title`)}
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {t(`rpg.tutorial.steps.${stepKey}.body`)}
          </p>
        </div>

        <div className="flex justify-center gap-1.5" aria-hidden="true">
          {TUTORIAL_STEP_KEYS.map((_, i) => (
            <span
              key={i}
              className={[
                'h-1.5 w-1.5 rounded-full transition',
                i === stepIndex
                  ? 'bg-slate-900 dark:bg-slate-100'
                  : 'bg-slate-300 dark:bg-slate-600',
              ].join(' ')}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStepIndex(Math.max(0, stepIndex - 1))}
            disabled={isFirst}
            className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 transition disabled:opacity-30 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          >
            {t('rpg.tutorial.prev')}
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-sm transition active:scale-[0.98] dark:bg-slate-100 dark:text-slate-900"
          >
            {t(isLast ? 'rpg.tutorial.done' : 'rpg.tutorial.next')}
          </button>
        </div>
      </div>
    </div>
  );
}
