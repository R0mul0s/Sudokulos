/**
 * Obrazovka nastavení — limit chyb, zvýraznění stejných číslic, auto-mazání poznámek.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { useTranslation } from 'react-i18next';
import {
  MAX_MISTAKES_OPTIONS,
  useSettingsStore,
  type MaxMistakesOption,
} from '@/store/settingsStore';

interface SettingsScreenProps {
  onClose: () => void;
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
      <span className="text-sm text-slate-900">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={[
          'relative h-6 w-11 rounded-full transition',
          value ? 'bg-slate-900' : 'bg-slate-300',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
            value ? 'left-5' : 'left-0.5',
          ].join(' ')}
        />
      </button>
    </label>
  );
}

export function SettingsScreen({ onClose }: SettingsScreenProps) {
  const { t } = useTranslation();
  const maxMistakes = useSettingsStore((s) => s.maxMistakes);
  const highlightSameDigits = useSettingsStore((s) => s.highlightSameDigits);
  const autoRemoveNotes = useSettingsStore((s) => s.autoRemoveNotes);
  const setMaxMistakes = useSettingsStore((s) => s.setMaxMistakes);
  const setHighlightSameDigits = useSettingsStore(
    (s) => s.setHighlightSameDigits,
  );
  const setAutoRemoveNotes = useSettingsStore((s) => s.setAutoRemoveNotes);
  const resetDefaults = useSettingsStore((s) => s.resetDefaults);

  const formatMistakesOption = (value: MaxMistakesOption): string =>
    value === 0
      ? t('settings.maxMistakesUnlimited')
      : t('settings.maxMistakesValue', { count: value });

  return (
    <div className="flex w-full flex-col gap-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('settings.title')}</h1>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white"
        >
          {t('settings.close')}
        </button>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-slate-600">
          {t('settings.maxMistakes')}
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {MAX_MISTAKES_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMaxMistakes(option)}
              className={[
                'rounded-xl px-3 py-2 text-sm font-medium shadow-sm transition',
                maxMistakes === option
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-900',
              ].join(' ')}
              aria-pressed={maxMistakes === option}
            >
              {formatMistakesOption(option)}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <ToggleRow
          label={t('settings.highlightSameDigits')}
          value={highlightSameDigits}
          onChange={setHighlightSameDigits}
        />
        <ToggleRow
          label={t('settings.autoRemoveNotes')}
          value={autoRemoveNotes}
          onChange={setAutoRemoveNotes}
        />
      </section>

      <button
        type="button"
        onClick={resetDefaults}
        className="self-start text-sm text-slate-600 underline-offset-4 hover:underline"
      >
        {t('settings.resetDefaults')}
      </button>
    </div>
  );
}
