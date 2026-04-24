/**
 * Kořenová komponenta — FSM přes obrazovky: menu / settings / stats / game /
 * RPG run (mapa, reward, konec).
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { useState } from 'react';
import { GameScreen } from '@/components/GameScreen';
import { MenuScreen } from '@/components/MenuScreen';
import { SettingsScreen } from '@/components/SettingsScreen';
import { StatsScreen } from '@/components/StatsScreen';
import { RunMapScreen } from '@/components/rpg/RunMapScreen';
import { RewardScreen } from '@/components/rpg/RewardScreen';
import { RunEndScreen } from '@/components/rpg/RunEndScreen';
import { useGameStore } from '@/store/gameStore';
import { useRunStore } from '@/store/runStore';
import { useThemeSync } from '@/hooks/useThemeSync';

type MenuTab = 'menu' | 'settings' | 'stats';

function App() {
  const status = useGameStore((s) => s.status);
  const startNewGame = useGameStore((s) => s.startNewGame);
  const abandonGame = useGameStore((s) => s.abandonGame);
  const run = useRunStore((s) => s.run);
  const result = useRunStore((s) => s.result);
  const [menuTab, setMenuTab] = useState<MenuTab>('menu');

  useThemeSync();

  const renderContent = () => {
    // RPG run má přednost — končí run end screen, pak reward, pak mapa / hra.
    if (result !== null) {
      return (
        <RunEndScreen
          onAcknowledge={() => {
            abandonGame();
            setMenuTab('menu');
          }}
        />
      );
    }

    if (run !== null) {
      if (run.pendingRewards !== null) {
        return (
          <RewardScreen
            onChosen={() => {
              abandonGame();
            }}
          />
        );
      }
      if (status === 'playing' || status === 'paused') {
        return <GameScreen />;
      }
      return (
        <RunMapScreen
          onStartLevel={() => {
            const node = run.nodes[run.currentNodeIndex];
            startNewGame(node.difficulty, node.mode);
          }}
          onAbandon={() => {
            setMenuTab('menu');
          }}
        />
      );
    }

    // Klasický flow.
    if (status === 'playing' || status === 'paused' || status === 'completed' || status === 'failed') {
      return <GameScreen />;
    }

    if (menuTab === 'settings') {
      return <SettingsScreen onClose={() => setMenuTab('menu')} />;
    }
    if (menuTab === 'stats') {
      return <StatsScreen onClose={() => setMenuTab('menu')} />;
    }
    return (
      <MenuScreen
        onOpenSettings={() => setMenuTab('settings')}
        onOpenStats={() => setMenuTab('stats')}
      />
    );
  };

  return (
    <div className="flex min-h-full flex-col items-center gap-6 p-4 text-slate-900 dark:text-slate-100 sm:p-6">
      <main className="flex w-full max-w-md flex-col items-center gap-4">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
