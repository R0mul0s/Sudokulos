/**
 * Kořenová komponenta — přepíná mezi menu, nastavením, statistikami a GameScreen
 * podle stavu storu a lokální UI volby (settings/stats overlay).
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { useState } from 'react';
import { GameScreen } from '@/components/GameScreen';
import { MenuScreen } from '@/components/MenuScreen';
import { SettingsScreen } from '@/components/SettingsScreen';
import { StatsScreen } from '@/components/StatsScreen';
import { useGameStore } from '@/store/gameStore';
import { useThemeSync } from '@/hooks/useThemeSync';

type Screen = 'menu' | 'settings' | 'stats';

function App() {
  const status = useGameStore((s) => s.status);
  const [screen, setScreen] = useState<Screen>('menu');

  useThemeSync();

  const inMenu = status === 'menu';

  const renderMenu = () => {
    if (screen === 'settings') {
      return <SettingsScreen onClose={() => setScreen('menu')} />;
    }
    if (screen === 'stats') {
      return <StatsScreen onClose={() => setScreen('menu')} />;
    }
    return (
      <MenuScreen
        onOpenSettings={() => setScreen('settings')}
        onOpenStats={() => setScreen('stats')}
      />
    );
  };

  return (
    <div className="flex min-h-full flex-col items-center gap-6 p-4 text-slate-900 dark:text-slate-100 sm:p-6">
      <main className="flex w-full max-w-md flex-col items-center gap-4">
        {inMenu ? renderMenu() : <GameScreen />}
      </main>
    </div>
  );
}

export default App;
