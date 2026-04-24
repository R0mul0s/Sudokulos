/**
 * Obrazovka nastavení — limit chyb, motiv, zvýraznění, auto-notes, haptika.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { useTranslation } from 'react-i18next';
import {
  MAX_MISTAKES_OPTIONS,
  THEME_OPTIONS,
  useSettingsStore,
  type MaxMistakesOption,
  type ThemePreference,
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
    <label className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-sm dark:bg-slate-800">
      <span className="text-sm text-slate-900 dark:text-slate-100">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={[
          'relative h-6 w-11 rounded-full transition',
          value
            ? 'bg-slate-900 dark:bg-slate-100'
            : 'bg-slate-300 dark:bg-slate-600',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all dark:bg-slate-900',
            value ? 'left-5' : 'left-0.5',
          ].join(' ')}
        />
      </button>
    </label>
  );
}

function OptionGroup<T extends string | number>({
  options,
  current,
  onChange,
  getLabel,
}: {
  options: readonly T[];
  current: T;
  onChange: (value: T) => void;
  getLabel: (value: T) => string;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((option) => {
        const selected = current === option;
        return (
          <button
            key={String(option)}
            type="button"
            onClick={() => onChange(option)}
            className={[
              'rounded-xl px-3 py-2 text-sm font-medium shadow-sm transition',
              selected
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100',
            ].join(' ')}
            aria-pressed={selected}
          >
            {getLabel(option)}
          </button>
        );
      })}
    </div>
  );
}

export function SettingsScreen({ onClose }: SettingsScreenProps) {
  const { t } = useTranslation();
  const maxMistakes = useSettingsStore((s) => s.maxMistakes);
  const theme = useSettingsStore((s) => s.theme);
  const highlightSameDigits = useSettingsStore((s) => s.highlightSameDigits);
  const autoRemoveNotes = useSettingsStore((s) => s.autoRemoveNotes);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const setMaxMistakes = useSettingsStore((s) => s.setMaxMistakes);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setHighlightSameDigits = useSettingsStore(
    (s) => s.setHighlightSameDigits,
  );
  const setAutoRemoveNotes = useSettingsStore((s) => s.setAutoRemoveNotes);
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled);
  const resetDefaults = useSettingsStore((s) => s.resetDefaults);

  const formatMistakesOption = (value: MaxMistakesOption): string =>
    value === 0
      ? t('settings.maxMistakesUnlimited')
      : t('settings.maxMistakesValue', { count: value });

  const formatThemeOption = (value: ThemePreference): string =>
    t(`settings.theme.${value}`);

  return (
    <div className="flex w-full flex-col gap-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {t('settings.title')}
        </h1>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white dark:bg-slate-100 dark:text-slate-900"
        >
          {t('settings.close')}
        </button>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">
          {t('settings.themeLabel')}
        </h2>
        <OptionGroup
          options={THEME_OPTIONS}
          current={theme}
          onChange={setTheme}
          getLabel={formatThemeOption}
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">
          {t('settings.maxMistakes')}
        </h2>
        <OptionGroup
          options={MAX_MISTAKES_OPTIONS}
          current={maxMistakes}
          onChange={setMaxMistakes}
          getLabel={formatMistakesOption}
        />
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
        <ToggleRow
          label={t('settings.haptics')}
          value={hapticsEnabled}
          onChange={setHapticsEnabled}
        />
      </section>

      <button
        type="button"
        onClick={resetDefaults}
        className="self-start text-sm text-slate-600 underline-offset-4 hover:underline dark:text-slate-400"
      >
        {t('settings.resetDefaults')}
      </button>
    </div>
  );
}
