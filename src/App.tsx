/**
 * Kořenová komponenta — FSM přes obrazovky: menu / settings / stats / game /
 * RPG run (mapa, mystery, shop, reward, konec).
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
import { MysteryScreen } from '@/components/rpg/MysteryScreen';
import { ShopScreen } from '@/components/rpg/ShopScreen';
import { MetaUnlocksScreen } from '@/components/rpg/MetaUnlocksScreen';
import { useGameStore } from '@/store/gameStore';
import { useRunStore } from '@/store/runStore';
import { isPuzzleNode } from '@/game/rpg/runMap';
import { useThemeSync } from '@/hooks/useThemeSync';

type MenuTab = 'menu' | 'settings' | 'stats' | 'meta';

function App() {
  const status = useGameStore((s) => s.status);
  const startNewGame = useGameStore((s) => s.startNewGame);
  const abandonGame = useGameStore((s) => s.abandonGame);
  const run = useRunStore((s) => s.run);
  const result = useRunStore((s) => s.result);
  const enterMysteryNode = useRunStore((s) => s.enterMysteryNode);
  const enterShopNode = useRunStore((s) => s.enterShopNode);
  const pendingMystery = useRunStore((s) => s.levelState.pendingMystery);
  const shopOffer = useRunStore((s) => s.levelState.shopOffer);
  const [menuTab, setMenuTab] = useState<MenuTab>('menu');

  useThemeSync();

  const renderContent = () => {
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

      const node = run.nodes[run.currentNodeIndex];

      if (node.type === 'mystery') {
        if (pendingMystery) {
          return <MysteryScreen onResolved={() => {}} />;
        }
        // Mystery uzel ještě nezahájen — render mapu kde "Vstoupit" jej spustí.
      }

      if (node.type === 'shop') {
        if (shopOffer) {
          return <ShopScreen onLeft={() => {}} />;
        }
      }

      if (
        isPuzzleNode(node.type) &&
        (status === 'playing' || status === 'paused')
      ) {
        return <GameScreen />;
      }

      return (
        <RunMapScreen
          onEnter={() => {
            const current = run.nodes[run.currentNodeIndex];
            if (isPuzzleNode(current.type)) {
              startNewGame(current.difficulty, current.mode);
              return;
            }
            if (current.type === 'mystery') {
              enterMysteryNode();
              return;
            }
            if (current.type === 'shop') {
              enterShopNode();
              return;
            }
          }}
          onAbandon={() => {
            setMenuTab('menu');
          }}
        />
      );
    }

    if (
      status === 'playing' ||
      status === 'paused' ||
      status === 'completed' ||
      status === 'failed'
    ) {
      return <GameScreen />;
    }

    if (menuTab === 'settings') {
      return <SettingsScreen onClose={() => setMenuTab('menu')} />;
    }
    if (menuTab === 'stats') {
      return <StatsScreen onClose={() => setMenuTab('menu')} />;
    }
    if (menuTab === 'meta') {
      return <MetaUnlocksScreen onClose={() => setMenuTab('menu')} />;
    }
    return (
      <MenuScreen
        onOpenSettings={() => setMenuTab('settings')}
        onOpenStats={() => setMenuTab('stats')}
        onOpenMeta={() => setMenuTab('meta')}
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
