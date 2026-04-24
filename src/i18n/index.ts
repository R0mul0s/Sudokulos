/**
 * i18next setup — cs (default) + en, autodetekce přes localStorage/navigator
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import cs from './locales/cs.json';
import en from './locales/en.json';

export const SUPPORTED_LANGUAGES = ['cs', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'cs';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      cs: { translation: cs },
      en: { translation: en },
    },
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'sudoku.lang',
    },
  });

export default i18n;
