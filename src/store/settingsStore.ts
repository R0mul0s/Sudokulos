/**
 * Zustand store uživatelských preferencí. Persistuje do localStorage.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** 0 znamená bez limitu. */
export type MaxMistakesOption = 0 | 3 | 5;

export const MAX_MISTAKES_OPTIONS: readonly MaxMistakesOption[] = [
  0, 3, 5,
] as const;

interface SettingsState {
  maxMistakes: MaxMistakesOption;
  highlightSameDigits: boolean;
  autoRemoveNotes: boolean;
}

interface SettingsActions {
  setMaxMistakes: (value: MaxMistakesOption) => void;
  setHighlightSameDigits: (value: boolean) => void;
  setAutoRemoveNotes: (value: boolean) => void;
  resetDefaults: () => void;
}

export type SettingsStore = SettingsState & SettingsActions;

const DEFAULTS: SettingsState = {
  maxMistakes: 3,
  highlightSameDigits: true,
  autoRemoveNotes: true,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setMaxMistakes: (maxMistakes) => set({ maxMistakes }),
      setHighlightSameDigits: (highlightSameDigits) =>
        set({ highlightSameDigits }),
      setAutoRemoveNotes: (autoRemoveNotes) => set({ autoRemoveNotes }),
      resetDefaults: () => set({ ...DEFAULTS }),
    }),
    {
      name: 'sudoku.settings',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({
        maxMistakes: state.maxMistakes,
        highlightSameDigits: state.highlightSameDigits,
        autoRemoveNotes: state.autoRemoveNotes,
      }),
    },
  ),
);
