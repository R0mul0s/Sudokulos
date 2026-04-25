/**
 * Meta profil RPG módu — persistuje přes celou historii hráče.
 * Drží souls (meta měnu), statistiky runů, odemčené třídy a relics,
 * agregaci výsledků per třída.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  CharacterClass,
  ClassRunStats,
  PlayerProfile,
  RelicId,
  RunResult,
} from '@/types/rpg';
import {
  RELIC_UNLOCK_COSTS,
  STARTER_RELIC_IDS,
} from '@/game/rpg/relics';

/** Cena za odemčení každé třídy v souls shopu. */
export const CLASS_UNLOCK_COSTS: Record<CharacterClass, number> = {
  warrior: 0,
  mage: 100,
  monk: 150,
};

const DEFAULT_PROFILE: PlayerProfile = {
  souls: 0,
  totalRuns: 0,
  runsWon: 0,
  bestRun: null,
  unlockedClasses: ['warrior'],
  unlockedRelics: [...STARTER_RELIC_IDS],
  perClassRuns: {},
};

interface ProfileState {
  profile: PlayerProfile;
}

interface ProfileActions {
  recordRunResult: (result: RunResult) => void;
  unlockClass: (cls: CharacterClass) => boolean;
  unlockRelic: (id: RelicId) => boolean;
  /** Debug / reset pro testy. */
  resetProfile: () => void;
}

export type ProfileStore = ProfileState & ProfileActions;

function isBetterRun(a: RunResult, b: RunResult | null): boolean {
  if (b === null) return true;
  if (a.won && !b.won) return true;
  if (!a.won && b.won) return false;
  if (a.levelsCompleted !== b.levelsCompleted) {
    return a.levelsCompleted > b.levelsCompleted;
  }
  if (a.won && b.won) return a.elapsedMs < b.elapsedMs;
  return false;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      profile: DEFAULT_PROFILE,

      recordRunResult: (result) => {
        set((state) => {
          const cls = result.characterClass;
          const prev: ClassRunStats =
            state.profile.perClassRuns[cls] ?? { played: 0, won: 0 };
          const nextPerClass = {
            ...state.profile.perClassRuns,
            [cls]: {
              played: prev.played + 1,
              won: prev.won + (result.won ? 1 : 0),
            },
          };
          return {
            profile: {
              ...state.profile,
              souls: state.profile.souls + result.soulsEarned,
              totalRuns: state.profile.totalRuns + 1,
              runsWon: state.profile.runsWon + (result.won ? 1 : 0),
              bestRun: isBetterRun(result, state.profile.bestRun)
                ? result
                : state.profile.bestRun,
              perClassRuns: nextPerClass,
            },
          };
        });
      },

      unlockClass: (cls) => {
        const { profile } = get();
        if (profile.unlockedClasses.includes(cls)) return false;
        const cost = CLASS_UNLOCK_COSTS[cls] ?? 0;
        if (profile.souls < cost) return false;
        set({
          profile: {
            ...profile,
            souls: profile.souls - cost,
            unlockedClasses: [...profile.unlockedClasses, cls],
          },
        });
        return true;
      },

      unlockRelic: (id) => {
        const { profile } = get();
        if (profile.unlockedRelics.includes(id)) return false;
        const cost = RELIC_UNLOCK_COSTS[id];
        if (cost === undefined) return false;
        if (profile.souls < cost) return false;
        set({
          profile: {
            ...profile,
            souls: profile.souls - cost,
            unlockedRelics: [...profile.unlockedRelics, id],
          },
        });
        return true;
      },

      resetProfile: () => {
        set({ profile: DEFAULT_PROFILE });
      },
    }),
    {
      name: 'sudoku.profile',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persisted, version) => {
        if (version < 2) {
          const old = persisted as { profile?: Partial<PlayerProfile> };
          return {
            profile: { ...DEFAULT_PROFILE, ...(old.profile ?? {}) },
          };
        }
        return persisted as ProfileState;
      },
    },
  ),
);
