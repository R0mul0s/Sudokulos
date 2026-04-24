/**
 * Přepínač jazyka mezi cs/en — persistuje přes i18next language detector do localStorage
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = (i18n.resolvedLanguage ?? 'cs') as SupportedLanguage;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    void i18n.changeLanguage(e.target.value);
  };

  return (
    <label className="flex flex-col items-end gap-1 text-xs text-slate-600">
      <span className="sr-only">{t('language.label')}</span>
      <select
        value={current}
        onChange={handleChange}
        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
      >
        {SUPPORTED_LANGUAGES.map((lng) => (
          <option key={lng} value={lng}>
            {t(`language.${lng}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
