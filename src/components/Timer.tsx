/**
 * Zobrazení uplynulého času hry a počtu chyb (s případným limitem).
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { formatElapsed } from './format';

export function Timer() {
  const { t } = useTranslation();
  const elapsedMs = useGameStore((s) => s.elapsedMs);
  const mistakes = useGameStore((s) => s.mistakes);
  const maxMistakes = useSettingsStore((s) => s.maxMistakes);

  const mistakesText =
    maxMistakes > 0
      ? t('game.mistakesLimit', { current: mistakes, max: maxMistakes })
      : String(mistakes);

  return (
    <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
      <div>
        <div className="text-xs uppercase tracking-wide">{t('game.time')}</div>
        <div className="font-mono text-lg text-slate-900 tabular-nums dark:text-slate-100">
          {formatElapsed(elapsedMs)}
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs uppercase tracking-wide">
          {t('game.mistakes')}
        </div>
        <div
          className={[
            'font-mono text-lg tabular-nums',
            mistakes > 0
              ? 'text-red-600 dark:text-red-400'
              : 'text-slate-900 dark:text-slate-100',
          ].join(' ')}
        >
          {mistakesText}
        </div>
      </div>
    </div>
  );
}
