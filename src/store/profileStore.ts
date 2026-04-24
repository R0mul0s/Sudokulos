/**
 * Meta profil RPG módu — persistuje přes celou historii hráče.
 * Drží souls (meta měnu), statistiky runů a nejlepší výsledek.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { PlayerProfile, RunResult } from '@/types/rpg';

interface ProfileState {
  profile: PlayerProfile;
}

interface ProfileActions {
  recordRunResult: (result: RunResult) => void;
  /** Debug / reset pro testy. */
  resetProfile: () => void;
}

export type ProfileStore = ProfileState & ProfileActions;

const DEFAULT_PROFILE: PlayerProfile = {
  souls: 0,
  totalRuns: 0,
  runsWon: 0,
  bestRun: null,
};

function isBetterRun(a: RunResult, b: RunResult | null): boolean {
  if (b === null) return true;
  if (a.won && !b.won) return true;
  if (!a.won && b.won) return false;
  // Stejný výsledek (oba win nebo oba lose) — preferuj víc dokončených levelů
  if (a.levelsCompleted !== b.levelsCompleted) {
    return a.levelsCompleted > b.levelsCompleted;
  }
  // Stejný progress — kratší čas je lepší (pouze pro win)
  if (a.won && b.won) return a.elapsedMs < b.elapsedMs;
  return false;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,

      recordRunResult: (result) => {
        set((state) => {
          const nextProfile: PlayerProfile = {
            souls: state.profile.souls + result.soulsEarned,
            totalRuns: state.profile.totalRuns + 1,
            runsWon: state.profile.runsWon + (result.won ? 1 : 0),
            bestRun: isBetterRun(result, state.profile.bestRun)
              ? result
              : state.profile.bestRun,
          };
          return { profile: nextProfile };
        });
      },

      resetProfile: () => {
        set({ profile: DEFAULT_PROFILE });
      },
    }),
    {
      name: 'sudoku.profile',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
