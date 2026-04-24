/**
 * Testy runStore — start runu, HP / combo tracking, chain bonusy,
 * relics hooks, progression mezi uzly, výsledek runu.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useRunStore } from './runStore';
import { useProfileStore } from './profileStore';
import { RUN_LENGTH } from '@/game/rpg/runMap';

describe('runStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useRunStore.setState({
      run: null,
      result: null,
      levelState: { firstMistakeForgiven: false },
    });
    useProfileStore.getState().resetProfile();
  });

  describe('startRun', () => {
    it('vytvoří Warrior run s výchozími staty', () => {
      useRunStore.getState().startRun('warrior', 42);
      const run = useRunStore.getState().run!;
      expect(run).not.toBeNull();
      expect(run.player.characterClass).toBe('warrior');
      expect(run.player.maxHp).toBe(3);
      expect(run.player.hp).toBe(3);
      expect(run.nodes).toHaveLength(RUN_LENGTH);
      expect(run.currentNodeIndex).toBe(0);
    });

    it('výchozí run nemá relics ani combo', () => {
      useRunStore.getState().startRun();
      const run = useRunStore.getState().run!;
      expect(run.player.relics).toHaveLength(0);
      expect(run.player.combo).toBe(0);
      expect(run.player.gold).toBe(0);
    });
  });

  describe('recordMistake', () => {
    it('strhne HP, resetuje combo, zvýší totalMistakes', () => {
      useRunStore.getState().startRun();
      useRunStore.setState((state) => ({
        run: state.run
          ? {
              ...state.run,
              player: { ...state.run.player, combo: 5, bestComboInRun: 5 },
            }
          : null,
      }));
      useRunStore.getState().recordMistake();
      const run = useRunStore.getState().run!;
      expect(run.player.hp).toBe(2);
      expect(run.player.combo).toBe(0);
      expect(run.totalMistakes).toBe(1);
    });

    it('při HP=0 ukončí run a zapíše result do profilu', () => {
      useRunStore.getState().startRun();
      useRunStore.getState().recordMistake();
      useRunStore.getState().recordMistake();
      useRunStore.getState().recordMistake();
      expect(useRunStore.getState().run).toBeNull();
      expect(useRunStore.getState().result).not.toBeNull();
      expect(useRunStore.getState().result!.won).toBe(false);
      // Souls se uložily do profilu
      expect(useProfileStore.getState().profile.totalRuns).toBe(1);
      expect(useProfileStore.getState().profile.souls).toBeGreaterThan(0);
    });

    it('Dragon scale odpustí první chybu v levelu', () => {
      useRunStore.getState().startRun();
      useRunStore.setState((state) => ({
        run: state.run
          ? {
              ...state.run,
              player: {
                ...state.run.player,
                relics: [{ id: 'dragon_scale', consumed: false }],
              },
            }
          : null,
      }));
      useRunStore.getState().recordMistake();
      expect(useRunStore.getState().run!.player.hp).toBe(3);
      // Druhá chyba už bere HP (flag firstMistakeForgiven je true)
      useRunStore.getState().recordMistake();
      expect(useRunStore.getState().run!.player.hp).toBe(2);
    });

    it('Phoenix oživí hráče při HP=0', () => {
      useRunStore.getState().startRun();
      useRunStore.setState((state) => ({
        run: state.run
          ? {
              ...state.run,
              player: {
                ...state.run.player,
                relics: [{ id: 'phoenix', consumed: false }],
              },
            }
          : null,
      }));
      useRunStore.getState().recordMistake();
      useRunStore.getState().recordMistake();
      useRunStore.getState().recordMistake();
      const run = useRunStore.getState().run!;
      expect(run).not.toBeNull();
      expect(run.player.hp).toBe(1);
      expect(run.player.relics[0].consumed).toBe(true);
      // Další smrt už run ukončí
      useRunStore.getState().recordMistake();
      expect(useRunStore.getState().run).toBeNull();
    });
  });

  describe('recordCorrect', () => {
    it('zvýší combo i bestComboInRun', () => {
      useRunStore.getState().startRun();
      useRunStore.getState().recordCorrect(0);
      useRunStore.getState().recordCorrect(0);
      const player = useRunStore.getState().run!.player;
      expect(player.combo).toBe(2);
      expect(player.bestComboInRun).toBe(2);
    });

    it('od combo 2 dává gold bonus', () => {
      useRunStore.getState().startRun();
      useRunStore.getState().recordCorrect(0); // combo 1, žádný bonus
      expect(useRunStore.getState().run!.player.gold).toBe(0);
      useRunStore.getState().recordCorrect(0); // combo 2
      expect(useRunStore.getState().run!.player.gold).toBeGreaterThan(0);
    });

    it('chain reaction dává gold a mana bonus', () => {
      useRunStore.getState().startRun();
      useRunStore.getState().recordCorrect(2);
      const player = useRunStore.getState().run!.player;
      expect(player.gold).toBeGreaterThan(0);
      expect(player.mana).toBeGreaterThan(0);
    });
  });

  describe('finishCurrentLevel a chooseReward', () => {
    it('dá reward options, gold bonus a přepne na další uzel', () => {
      useRunStore.getState().startRun('warrior', 1);
      useRunStore.getState().finishCurrentLevel(60_000);
      const run = useRunStore.getState().run!;
      expect(run.pendingRewards).not.toBeNull();
      expect(run.pendingRewards!.length).toBe(3);
      expect(run.player.gold).toBeGreaterThan(0);
    });

    it('chooseReward aplikuje odměnu a přejde na další uzel', () => {
      useRunStore.getState().startRun('warrior', 1);
      useRunStore.getState().finishCurrentLevel(60_000);
      const goldBefore = useRunStore.getState().run!.player.gold;
      // Vynutíme konkrétní reward pro deterministický test
      useRunStore.setState((state) => ({
        run: state.run
          ? {
              ...state.run,
              pendingRewards: [{ kind: 'gold', amount: 100 }],
            }
          : null,
      }));
      useRunStore.getState().chooseReward(0);
      expect(useRunStore.getState().run!.player.gold).toBe(goldBefore + 100);
      expect(useRunStore.getState().run!.currentNodeIndex).toBe(1);
      expect(useRunStore.getState().run!.pendingRewards).toBeNull();
    });

    it('dokončení bossu (posledního uzlu) ukončí run jako výhru', () => {
      useRunStore.getState().startRun('warrior', 1);
      // Přeskočíme na boss node
      useRunStore.setState((state) => ({
        run: state.run
          ? {
              ...state.run,
              currentNodeIndex: RUN_LENGTH - 1,
            }
          : null,
      }));
      useRunStore.getState().finishCurrentLevel(120_000);
      // Vybrat libovolný reward ukončí run
      useRunStore.getState().chooseReward(0);
      expect(useRunStore.getState().run).toBeNull();
      expect(useRunStore.getState().result!.won).toBe(true);
      expect(useProfileStore.getState().profile.runsWon).toBe(1);
    });
  });
});
