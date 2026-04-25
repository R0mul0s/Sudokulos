/**
 * Testy profileStore — defaultní profil, recordRunResult per-class, unlocky.
 *
 * @author Roman Hlaváček
 * @created 2026-04-25
 */
import { beforeEach, describe, expect, it } from 'vitest';
import type { RunResult } from '@/types/rpg';
import { CLASS_UNLOCK_COSTS, useProfileStore } from './profileStore';
import { STARTER_RELIC_IDS } from '@/game/rpg/relics';

function makeResult(overrides: Partial<RunResult> = {}): RunResult {
  return {
    characterClass: 'warrior',
    won: false,
    levelsCompleted: 1,
    totalLevels: 8,
    finalHp: 0,
    relicIds: [],
    goldCollected: 0,
    bestCombo: 0,
    totalMistakes: 3,
    elapsedMs: 60_000,
    soulsEarned: 20,
    finishedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('profileStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useProfileStore.getState().resetProfile();
  });

  describe('defaultní profil', () => {
    it('má warrior odemčeného a všechny common+uncommon relics', () => {
      const profile = useProfileStore.getState().profile;
      expect(profile.unlockedClasses).toEqual(['warrior']);
      expect(profile.unlockedRelics).toEqual(STARTER_RELIC_IDS);
      expect(profile.souls).toBe(0);
    });
  });

  describe('recordRunResult', () => {
    it('agreguje per-class statistiky', () => {
      useProfileStore
        .getState()
        .recordRunResult(makeResult({ characterClass: 'warrior', won: true }));
      useProfileStore
        .getState()
        .recordRunResult(makeResult({ characterClass: 'warrior', won: false }));
      useProfileStore
        .getState()
        .recordRunResult(makeResult({ characterClass: 'mage', won: true }));
      const profile = useProfileStore.getState().profile;
      expect(profile.totalRuns).toBe(3);
      expect(profile.runsWon).toBe(2);
      expect(profile.perClassRuns.warrior).toEqual({ played: 2, won: 1 });
      expect(profile.perClassRuns.mage).toEqual({ played: 1, won: 1 });
    });

    it('přičte souls za každý run', () => {
      useProfileStore.getState().recordRunResult(makeResult({ soulsEarned: 50 }));
      useProfileStore.getState().recordRunResult(makeResult({ soulsEarned: 75 }));
      expect(useProfileStore.getState().profile.souls).toBe(125);
    });
  });

  describe('unlockClass', () => {
    it('odemkne třídu pokud má hráč dost souls', () => {
      useProfileStore.setState((state) => ({
        profile: { ...state.profile, souls: CLASS_UNLOCK_COSTS.mage + 10 },
      }));
      const ok = useProfileStore.getState().unlockClass('mage');
      expect(ok).toBe(true);
      const profile = useProfileStore.getState().profile;
      expect(profile.unlockedClasses).toContain('mage');
      expect(profile.souls).toBe(10);
    });

    it('vrátí false pokud nemá dost souls', () => {
      useProfileStore.setState((state) => ({
        profile: { ...state.profile, souls: 10 },
      }));
      const ok = useProfileStore.getState().unlockClass('mage');
      expect(ok).toBe(false);
      expect(useProfileStore.getState().profile.souls).toBe(10);
    });

    it('vrátí false pokud je třída už odemčená', () => {
      const ok = useProfileStore.getState().unlockClass('warrior');
      expect(ok).toBe(false);
    });
  });

  describe('unlockRelic', () => {
    it('odemkne rare relic pokud má hráč dost souls', () => {
      useProfileStore.setState((state) => ({
        profile: { ...state.profile, souls: 200 },
      }));
      const ok = useProfileStore.getState().unlockRelic('phoenix');
      expect(ok).toBe(true);
      expect(useProfileStore.getState().profile.unlockedRelics).toContain(
        'phoenix',
      );
    });

    it('vrátí false pro relic, který není rare (nemá cenu)', () => {
      useProfileStore.setState((state) => ({
        profile: { ...state.profile, souls: 1000 },
      }));
      const ok = useProfileStore.getState().unlockRelic('amulet_of_insight');
      expect(ok).toBe(false);
    });

    it('vrátí false pokud relic už je odemčený', () => {
      useProfileStore.setState((state) => ({
        profile: {
          ...state.profile,
          souls: 1000,
          unlockedRelics: [...state.profile.unlockedRelics, 'phoenix'],
        },
      }));
      const ok = useProfileStore.getState().unlockRelic('phoenix');
      expect(ok).toBe(false);
    });
  });
});
