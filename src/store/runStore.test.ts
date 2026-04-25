/**
 * Testy runStore — start runu, HP / combo tracking, chain bonusy,
 * relics hooks, progression mezi uzly, výsledek runu.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRunStore } from './runStore';
import { useProfileStore } from './profileStore';
import { RUN_LENGTH } from '@/game/rpg/runMap';

describe('runStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useRunStore.setState({
      run: null,
      result: null,
      levelState: {
        firstMistakeForgiven: false,
        shieldActive: false,
        peek: null,
        consumedLuckyCells: [],
        pendingMystery: null,
        shopOffer: null,
      },
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

  describe('power-ups', () => {
    it('activateShield bez slotu vrátí false', () => {
      useRunStore.getState().startRun();
      expect(useRunStore.getState().activateShield()).toBe(false);
    });

    it('Shield pohltí příští mistake bez ztráty HP a beze zbavení combo', () => {
      useRunStore.getState().startRun();
      useRunStore.setState((state) => ({
        run: state.run
          ? {
              ...state.run,
              player: {
                ...state.run.player,
                powerUp: { id: 'shield', charges: 1 },
                combo: 4,
              },
            }
          : null,
      }));
      expect(useRunStore.getState().activateShield()).toBe(true);
      expect(useRunStore.getState().run!.player.powerUp).toBeNull();
      expect(useRunStore.getState().levelState.shieldActive).toBe(true);
      const hpBefore = useRunStore.getState().run!.player.hp;
      useRunStore.getState().recordMistake();
      // Shield se spotřeboval, HP nezměněné
      expect(useRunStore.getState().run!.player.hp).toBe(hpBefore);
      expect(useRunStore.getState().levelState.shieldActive).toBe(false);
    });

    it('Peek aktivuje vodoznak a po expirační době se zruší', () => {
      vi.useFakeTimers();
      try {
        useRunStore.getState().startRun();
        useRunStore.setState((state) => ({
          run: state.run
            ? {
                ...state.run,
                player: {
                  ...state.run.player,
                  powerUp: { id: 'peek', charges: 1 },
                },
              }
            : null,
        }));
        const ok = useRunStore.getState().activatePeek(2, 4, 7);
        expect(ok).toBe(true);
        expect(useRunStore.getState().levelState.peek).toEqual(
          expect.objectContaining({ row: 2, col: 4, value: 7 }),
        );
        expect(useRunStore.getState().run!.player.powerUp).toBeNull();
        vi.advanceTimersByTime(3_500);
        expect(useRunStore.getState().levelState.peek).toBeNull();
      } finally {
        vi.useRealTimers();
      }
    });

    it('Spell Book dá 2 charges power-upu z dropu', () => {
      useRunStore.getState().startRun();
      useRunStore.setState((state) => ({
        run: state.run
          ? {
              ...state.run,
              player: {
                ...state.run.player,
                relics: [{ id: 'spell_book', consumed: false }],
              },
              pendingRewards: [{ kind: 'power_up', powerUpId: 'shield' }],
            }
          : null,
      }));
      useRunStore.getState().chooseReward(0);
      // Pendinrewards shut, currentNodeIndex advanced — power-up je v slotu
      // (state vidíme po advance levelState reset).
      // Use před chooseReward by neproběhlo, takže si načteme stav před přepnutím:
      // power-up je v new player slotu po `applyReward` s 2 charges (kvůli spell_book).
      expect(useRunStore.getState().run!.player.powerUp).toEqual({
        id: 'shield',
        charges: 2,
      });
    });
  });

  describe('mystery uzly', () => {
    it('enterMysteryNode na mystery uzlu vygeneruje událost', () => {
      useRunStore.getState().startRun('warrior', 1);
      // Najdi mystery uzel index a posuň se tam
      const mysteryIdx = useRunStore
        .getState()
        .run!.nodes.findIndex((n) => n.type === 'mystery');
      expect(mysteryIdx).toBeGreaterThanOrEqual(0);
      useRunStore.setState((state) => ({
        run: state.run
          ? { ...state.run, currentNodeIndex: mysteryIdx }
          : null,
      }));
      useRunStore.getState().enterMysteryNode();
      expect(useRunStore.getState().levelState.pendingMystery).not.toBeNull();
    });

    it('resolveMysteryNode (rest, accept) vyléčí HP a postoupí', () => {
      useRunStore.getState().startRun('warrior', 1);
      const mysteryIdx = useRunStore
        .getState()
        .run!.nodes.findIndex((n) => n.type === 'mystery');
      useRunStore.setState((state) => ({
        run: state.run
          ? {
              ...state.run,
              currentNodeIndex: mysteryIdx,
              player: { ...state.run.player, hp: 1 },
            }
          : null,
        levelState: {
          ...state.levelState,
          pendingMystery: { kind: 'rest', hpHeal: 2 },
        },
      }));
      useRunStore.getState().resolveMysteryNode(true);
      expect(useRunStore.getState().run!.player.hp).toBe(3);
      expect(useRunStore.getState().run!.currentNodeIndex).toBe(mysteryIdx + 1);
      expect(useRunStore.getState().levelState.pendingMystery).toBeNull();
    });

    it('resolveMysteryNode (skip) postoupí bez efektu', () => {
      useRunStore.getState().startRun('warrior', 1);
      useRunStore.setState((state) => ({
        levelState: {
          ...state.levelState,
          pendingMystery: { kind: 'chest_gold', amount: 100 },
        },
      }));
      const goldBefore = useRunStore.getState().run!.player.gold;
      useRunStore.getState().resolveMysteryNode(false);
      expect(useRunStore.getState().run!.player.gold).toBe(goldBefore);
    });
  });

  describe('shop uzly', () => {
    it('enterShopNode vygeneruje nabídku', () => {
      useRunStore.getState().startRun('warrior', 1);
      const shopIdx = useRunStore
        .getState()
        .run!.nodes.findIndex((n) => n.type === 'shop');
      useRunStore.setState((state) => ({
        run: state.run
          ? { ...state.run, currentNodeIndex: shopIdx }
          : null,
      }));
      useRunStore.getState().enterShopNode();
      const offer = useRunStore.getState().levelState.shopOffer;
      expect(offer).not.toBeNull();
      expect(offer!.length).toBeGreaterThan(0);
    });

    it('purchaseShopItem odečte gold a aplikuje efekt', () => {
      useRunStore.getState().startRun('warrior', 1);
      useRunStore.setState((state) => ({
        run: state.run
          ? {
              ...state.run,
              player: { ...state.run.player, gold: 200, hp: 1 },
            }
          : null,
        levelState: {
          ...state.levelState,
          shopOffer: [{ kind: 'potion_hp', price: 50 }],
        },
      }));
      const ok = useRunStore.getState().purchaseShopItem(0);
      expect(ok).toBe(true);
      expect(useRunStore.getState().run!.player.gold).toBe(150);
      expect(useRunStore.getState().run!.player.hp).toBe(2);
      expect(useRunStore.getState().levelState.shopOffer).toHaveLength(0);
    });

    it('purchaseShopItem bez dostatečného gold vrátí false', () => {
      useRunStore.getState().startRun('warrior', 1);
      useRunStore.setState((state) => ({
        run: state.run
          ? { ...state.run, player: { ...state.run.player, gold: 10 } }
          : null,
        levelState: {
          ...state.levelState,
          shopOffer: [{ kind: 'potion_hp', price: 50 }],
        },
      }));
      const ok = useRunStore.getState().purchaseShopItem(0);
      expect(ok).toBe(false);
      expect(useRunStore.getState().run!.player.gold).toBe(10);
    });

    it('leaveShopNode posune se na další uzel', () => {
      useRunStore.getState().startRun('warrior', 1);
      const shopIdx = useRunStore
        .getState()
        .run!.nodes.findIndex((n) => n.type === 'shop');
      useRunStore.setState((state) => ({
        run: state.run
          ? { ...state.run, currentNodeIndex: shopIdx }
          : null,
      }));
      useRunStore.getState().leaveShopNode();
      expect(useRunStore.getState().run!.currentNodeIndex).toBe(shopIdx + 1);
    });
  });

  describe('elite reward', () => {
    it('finishCurrentLevel na elite uzlu garantuje aspoň jeden relic v rewardu', () => {
      useRunStore.getState().startRun('warrior', 1);
      const eliteIdx = useRunStore
        .getState()
        .run!.nodes.findIndex((n) => n.type === 'elite');
      useRunStore.setState((state) => ({
        run: state.run
          ? { ...state.run, currentNodeIndex: eliteIdx }
          : null,
      }));
      useRunStore.getState().finishCurrentLevel(60_000);
      const rewards = useRunStore.getState().run!.pendingRewards!;
      const hasRelic = rewards.some((r) => r.kind === 'relic');
      expect(hasRelic).toBe(true);
    });
  });

  describe('unlockedRelics filtrace', () => {
    it('reward generator nedá relic, který hráč ještě neodemkl', () => {
      // Nastavíme profil tak, aby neměl phoenix odemčený a měl jen jednu volbu
      useProfileStore.setState((state) => ({
        profile: {
          ...state.profile,
          unlockedRelics: ['amulet_of_insight'],
        },
      }));
      useRunStore.getState().startRun('warrior', 1);
      // Forcujeme finishCurrentLevel
      useRunStore.getState().finishCurrentLevel(60_000);
      const rewards = useRunStore.getState().run!.pendingRewards!;
      for (const reward of rewards) {
        if (reward.kind === 'relic') {
          expect(reward.relicId).toBe('amulet_of_insight');
        }
      }
    });

    it('startRun se zamčenou třídou spadne zpět na warrior', () => {
      // Mage není v unlockedClasses default
      useRunStore.getState().startRun('mage', 1);
      expect(useRunStore.getState().run!.player.characterClass).toBe('warrior');
    });

    it('startRun s odemčenou třídou ji použije', () => {
      useProfileStore.setState((state) => ({
        profile: {
          ...state.profile,
          unlockedClasses: [...state.profile.unlockedClasses, 'mage'],
        },
      }));
      useRunStore.getState().startRun('mage', 1);
      expect(useRunStore.getState().run!.player.characterClass).toBe('mage');
    });
  });

  describe('třídy a startovní relics', () => {
    beforeEach(() => {
      // Pro tyto testy předpokládáme, že hráč už si odemknul všechny třídy.
      useProfileStore.setState((state) => ({
        profile: {
          ...state.profile,
          unlockedClasses: ['warrior', 'mage', 'monk'],
        },
      }));
    });

    it('Mage začíná s 2 HP, 20 maxMana a Mana Vial v inventáři', () => {
      useRunStore.getState().startRun('mage', 1);
      const player = useRunStore.getState().run!.player;
      expect(player.maxHp).toBe(2);
      expect(player.maxMana).toBe(20);
      expect(player.relics.some((r) => r.id === 'mana_vial')).toBe(true);
    });

    it('Monk začíná se 4 HP a Dragon Scale v inventáři', () => {
      useRunStore.getState().startRun('monk', 1);
      const player = useRunStore.getState().run!.player;
      expect(player.maxHp).toBe(4);
      expect(player.relics.some((r) => r.id === 'dragon_scale')).toBe(true);
    });
  });

  describe('rare relics', () => {
    it('Stone Totem zdvojnásobí chain gold a manu', () => {
      useRunStore.getState().startRun('warrior', 1);
      useRunStore.setState((state) => ({
        run: state.run
          ? {
              ...state.run,
              player: {
                ...state.run.player,
                relics: [{ id: 'stone_totem', consumed: false }],
              },
            }
          : null,
      }));
      const before = useRunStore.getState().run!.player.gold;
      useRunStore.getState().recordCorrect(1);
      const after = useRunStore.getState().run!.player.gold;
      // Bez stone totem by chain dal 25 gold; s ním 50.
      expect(after - before).toBeGreaterThanOrEqual(50);
    });

    it('Shadow dá 5 lucky cells místo 3', () => {
      useRunStore.getState().startRun('warrior', 1);
      useRunStore.setState((state) => ({
        run: state.run
          ? {
              ...state.run,
              player: {
                ...state.run.player,
                relics: [{ id: 'shadow', consumed: false }],
              },
            }
          : null,
      }));
      const empty: Array<[number, number]> = [];
      for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) empty.push([r, c]);
      useRunStore.getState().initLuckyCells(empty);
      expect(useRunStore.getState().run!.luckyCells).toHaveLength(5);
    });

    it('Blood Altar tlačítko: −1 HP a +50 gold', () => {
      useRunStore.getState().startRun('warrior', 1);
      useRunStore.setState((state) => ({
        run: state.run
          ? {
              ...state.run,
              player: {
                ...state.run.player,
                relics: [{ id: 'blood_altar', consumed: false }],
                hp: 3,
                gold: 0,
              },
            }
          : null,
      }));
      const ok = useRunStore.getState().activateBloodAltar();
      expect(ok).toBe(true);
      const player = useRunStore.getState().run!.player;
      expect(player.hp).toBe(2);
      expect(player.gold).toBe(50);
    });

    it('Blood Altar nefunguje při HP = 1', () => {
      useRunStore.getState().startRun('warrior', 1);
      useRunStore.setState((state) => ({
        run: state.run
          ? {
              ...state.run,
              player: {
                ...state.run.player,
                relics: [{ id: 'blood_altar', consumed: false }],
                hp: 1,
              },
            }
          : null,
      }));
      expect(useRunStore.getState().activateBloodAltar()).toBe(false);
    });

    it('Golden Pact: −1 maxHp ale +25 % gold ze všech zdrojů', () => {
      useRunStore.getState().startRun('warrior', 1);
      // Aplikujeme golden_pact ručně přes startovní state
      useRunStore.setState((state) => {
        if (!state.run) return state;
        const newPlayer = {
          ...state.run.player,
          maxHp: state.run.player.maxHp - 1,
          hp: Math.min(state.run.player.hp, state.run.player.maxHp - 1),
          relics: [{ id: 'golden_pact' as const, consumed: false }],
        };
        return { run: { ...state.run, player: newPlayer } };
      });
      expect(useRunStore.getState().run!.player.maxHp).toBe(2);
      // 50 gold reward * 1.25 = 62
      const before = useRunStore.getState().run!.player.gold;
      useRunStore.setState((state) => ({
        run: state.run
          ? {
              ...state.run,
              pendingRewards: [{ kind: 'gold', amount: 100 }],
            }
          : null,
      }));
      useRunStore.getState().chooseReward(0);
      // applyReward gold = 100 * 1.25 = 125
      expect(useRunStore.getState().run!.player.gold).toBe(before + 125);
    });
  });

  describe('lucky cells', () => {
    it('initLuckyCells vybere N pozic z dostupných prázdných', () => {
      useRunStore.getState().startRun('warrior', 99);
      const empty: Array<[number, number]> = [];
      for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) empty.push([r, c]);
      useRunStore.getState().initLuckyCells(empty);
      const lucky = useRunStore.getState().run!.luckyCells;
      expect(lucky).toHaveLength(3);
      expect(new Set(lucky).size).toBe(3);
    });

    it('správně vyplněná lucky cell dá gold + manu', () => {
      useRunStore.getState().startRun();
      useRunStore.setState((state) => ({
        run: state.run
          ? { ...state.run, luckyCells: ['1,1'] }
          : null,
      }));
      const goldBefore = useRunStore.getState().run!.player.gold;
      useRunStore.getState().recordLuckyHit(1, 1, true);
      expect(useRunStore.getState().run!.player.gold).toBeGreaterThan(
        goldBefore,
      );
      expect(useRunStore.getState().run!.player.mana).toBeGreaterThan(0);
    });

    it('špatně vyplněná lucky cell strhne extra HP', () => {
      useRunStore.getState().startRun();
      useRunStore.setState((state) => ({
        run: state.run
          ? { ...state.run, luckyCells: ['2,2'] }
          : null,
      }));
      const hpBefore = useRunStore.getState().run!.player.hp;
      useRunStore.getState().recordLuckyHit(2, 2, false);
      expect(useRunStore.getState().run!.player.hp).toBe(hpBefore - 1);
    });

    it('lucky cell se započítá jen jednou za level', () => {
      useRunStore.getState().startRun();
      useRunStore.setState((state) => ({
        run: state.run
          ? { ...state.run, luckyCells: ['3,3'] }
          : null,
      }));
      useRunStore.getState().recordLuckyHit(3, 3, true);
      const goldAfterFirst = useRunStore.getState().run!.player.gold;
      useRunStore.getState().recordLuckyHit(3, 3, true);
      expect(useRunStore.getState().run!.player.gold).toBe(goldAfterFirst);
    });
  });
});
