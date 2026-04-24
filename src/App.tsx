/**
 * Kořenová komponenta — přepíná mezi menu, nastavením a GameScreen podle
 * stavu storu a lokální UI volby (settings overlay).
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { useState } from 'react';
import { GameScreen } from '@/components/GameScreen';
import { MenuScreen } from '@/components/MenuScreen';
import { SettingsScreen } from '@/components/SettingsScreen';
import { useGameStore } from '@/store/gameStore';

function App() {
  const status = useGameStore((s) => s.status);
  const [showSettings, setShowSettings] = useState(false);

  const inMenu = status === 'menu';

  return (
    <div className="flex min-h-full flex-col items-center gap-6 p-4 text-slate-900 sm:p-6">
      <main className="flex w-full max-w-md flex-col items-center gap-4">
        {showSettings ? (
          <SettingsScreen onClose={() => setShowSettings(false)} />
        ) : inMenu ? (
          <MenuScreen onOpenSettings={() => setShowSettings(true)} />
        ) : (
          <GameScreen />
        )}
      </main>
    </div>
  );
}

export default App;
