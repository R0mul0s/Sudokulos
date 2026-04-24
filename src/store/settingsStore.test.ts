/**
 * Testy settingsStore — setters, defaults, persist.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useSettingsStore } from './settingsStore';

describe('settingsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.getState().resetDefaults();
  });

  it('má rozumné defaultní hodnoty', () => {
    const state = useSettingsStore.getState();
    expect(state.maxMistakes).toBe(3);
    expect(state.highlightSameDigits).toBe(true);
    expect(state.autoRemoveNotes).toBe(true);
  });

  it('setMaxMistakes aktualizuje hodnotu', () => {
    useSettingsStore.getState().setMaxMistakes(0);
    expect(useSettingsStore.getState().maxMistakes).toBe(0);
    useSettingsStore.getState().setMaxMistakes(5);
    expect(useSettingsStore.getState().maxMistakes).toBe(5);
  });

  it('toggly lze přepnout', () => {
    useSettingsStore.getState().setHighlightSameDigits(false);
    expect(useSettingsStore.getState().highlightSameDigits).toBe(false);
    useSettingsStore.getState().setAutoRemoveNotes(false);
    expect(useSettingsStore.getState().autoRemoveNotes).toBe(false);
  });

  it('resetDefaults vrátí vše na výchozí', () => {
    const store = useSettingsStore.getState();
    store.setMaxMistakes(0);
    store.setHighlightSameDigits(false);
    store.setAutoRemoveNotes(false);
    store.resetDefaults();
    const state = useSettingsStore.getState();
    expect(state.maxMistakes).toBe(3);
    expect(state.highlightSameDigits).toBe(true);
    expect(state.autoRemoveNotes).toBe(true);
  });

  it('persistuje do localStorage', () => {
    useSettingsStore.getState().setMaxMistakes(5);
    useSettingsStore.getState().setHighlightSameDigits(false);
    const raw = localStorage.getItem('sudoku.settings');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!) as {
      state: { maxMistakes: number; highlightSameDigits: boolean };
    };
    expect(parsed.state.maxMistakes).toBe(5);
    expect(parsed.state.highlightSameDigits).toBe(false);
  });
});
