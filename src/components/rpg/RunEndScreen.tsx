/**
 * Obrazovka konce runu — shrnutí (výhra / smrt) a získané souls.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { useTranslation } from 'react-i18next';
import { useRunStore } from '@/store/runStore';
import { formatElapsed } from '../format';

interface RunEndScreenProps {
  onAcknowledge: () => void;
}

export function RunEndScreen({ onAcknowledge }: RunEndScreenProps) {
  const { t } = useTranslation();
  const result = useRunStore((s) => s.result);
  const acknowledgeResult = useRunStore((s) => s.acknowledgeResult);

  if (!result) return null;

  const handleAcknowledge = () => {
    acknowledgeResult();
    onAcknowledge();
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <header>
        <h1
          className={[
            'text-3xl font-semibold',
            result.won
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400',
          ].join(' ')}
        >
          {result.won ? t('rpg.end.winTitle') : t('rpg.end.loseTitle')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {result.won
            ? t('rpg.end.winSubtitle')
            : t('rpg.end.loseSubtitle', {
                completed: result.levelsCompleted,
                total: result.totalLevels,
              })}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-2">
        <Tile
          label={t('rpg.end.soulsEarned')}
          value={`+${result.soulsEarned} 🪙`}
        />
        <Tile
          label={t('rpg.end.time')}
          value={formatElapsed(result.elapsedMs)}
        />
        <Tile label={t('rpg.end.bestCombo')} value={`×${result.bestCombo}`} />
        <Tile
          label={t('rpg.end.gold')}
          value={`${result.goldCollected} 💰`}
        />
        <Tile
          label={t('rpg.end.mistakes')}
          value={String(result.totalMistakes)}
        />
        <Tile label={t('rpg.end.finalHp')} value={`${result.finalHp} ❤️`} />
      </section>

      {result.relicIds.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">
            {t('rpg.end.collectedRelics')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {result.relicIds.map((id) => (
              <span
                key={id}
                className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm dark:bg-slate-800"
              >
                {t(`rpg.relic.${id}.name`)}
              </span>
            ))}
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={handleAcknowledge}
        className="rounded-2xl bg-slate-900 px-4 py-3 text-center text-white shadow-sm transition active:scale-[0.98] dark:bg-slate-100 dark:text-slate-900"
      >
        {t('rpg.end.backToMenu')}
      </button>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-white px-4 py-3 shadow-sm dark:bg-slate-800">
      <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </span>
    </div>
  );
}
