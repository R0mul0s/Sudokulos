/**
 * Sleduje theme preferenci ze settingsStore a aplikuje / odebírá
 * .dark třídu na <html>. Při 'system' poslouchá prefers-color-scheme.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

export function useThemeSync(): void {
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;

    const apply = (isDark: boolean): void => {
      if (isDark) root.classList.add('dark');
      else root.classList.remove('dark');
    };

    if (theme === 'light') {
      apply(false);
      return;
    }
    if (theme === 'dark') {
      apply(true);
      return;
    }

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    apply(mq.matches);
    const handler = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);
}
