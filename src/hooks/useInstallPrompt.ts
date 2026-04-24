/**
 * Hook pro PWA install prompt. Poslouchá událost beforeinstallprompt,
 * umožní ji deferrem spustit z vlastního UI a hlídá stav instalace.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: readonly string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export type InstallState = 'unavailable' | 'available' | 'installed';

interface UseInstallPromptResult {
  state: InstallState;
  install: () => Promise<void>;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

export function useInstallPrompt(): UseInstallPromptResult {
  const [state, setState] = useState<InstallState>('unavailable');
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    if (isStandalone()) {
      setState('installed');
      return;
    }

    const handleBefore = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setState('available');
    };
    const handleInstalled = () => {
      setState('installed');
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', handleBefore);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBefore);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') setState('installed');
    setDeferred(null);
  }, [deferred]);

  return { state, install };
}
