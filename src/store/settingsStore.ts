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

export type ThemePreference = 'system' | 'light' | 'dark';
export const THEME_OPTIONS: readonly ThemePreference[] = [
  'system',
  'light',
  'dark',
] as const;

interface SettingsState {
  maxMistakes: MaxMistakesOption;
  highlightSameDigits: boolean;
  autoRemoveNotes: boolean;
  theme: ThemePreference;
  hapticsEnabled: boolean;
}

interface SettingsActions {
  setMaxMistakes: (value: MaxMistakesOption) => void;
  setHighlightSameDigits: (value: boolean) => void;
  setAutoRemoveNotes: (value: boolean) => void;
  setTheme: (value: ThemePreference) => void;
  setHapticsEnabled: (value: boolean) => void;
  resetDefaults: () => void;
}

export type SettingsStore = SettingsState & SettingsActions;

const DEFAULTS: SettingsState = {
  maxMistakes: 3,
  highlightSameDigits: true,
  autoRemoveNotes: true,
  theme: 'system',
  hapticsEnabled: true,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setMaxMistakes: (maxMistakes) => set({ maxMistakes }),
      setHighlightSameDigits: (highlightSameDigits) =>
        set({ highlightSameDigits }),
      setAutoRemoveNotes: (autoRemoveNotes) => set({ autoRemoveNotes }),
      setTheme: (theme) => set({ theme }),
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
      resetDefaults: () => set({ ...DEFAULTS }),
    }),
    {
      name: 'sudoku.settings',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      partialize: (state) => ({
        maxMistakes: state.maxMistakes,
        highlightSameDigits: state.highlightSameDigits,
        autoRemoveNotes: state.autoRemoveNotes,
        theme: state.theme,
        hapticsEnabled: state.hapticsEnabled,
      }),
    },
  ),
);
