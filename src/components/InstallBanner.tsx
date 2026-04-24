/**
 * Nenápadný banner pobízející k instalaci PWA. Viditelný jen když
 * browser podporuje beforeinstallprompt a aplikace ještě není nainstalovaná.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { useTranslation } from 'react-i18next';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

export function InstallBanner() {
  const { t } = useTranslation();
  const { state, install } = useInstallPrompt();

  if (state !== 'available') return null;

  return (
    <button
      type="button"
      onClick={install}
      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-left shadow-sm transition active:scale-[0.98]"
    >
      <div>
        <div className="text-sm font-semibold text-slate-900">
          {t('install.title')}
        </div>
        <div className="text-xs text-slate-600">{t('install.subtitle')}</div>
      </div>
      <span className="text-lg">⬇</span>
    </button>
  );
}
