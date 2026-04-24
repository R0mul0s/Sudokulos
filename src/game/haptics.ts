/**
 * Haptická odezva přes Web Vibration API. Respektuje user setting
 * hapticsEnabled a tiše nic nedělá, pokud API není dostupné (desktop, iOS Safari).
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { useSettingsStore } from '@/store/settingsStore';

/** Předdefinované patterny (ms) pro jednotné chování napříč akcemi. */
export const HAPTIC_PATTERNS = {
  /** Krátký puls — stisk klávesy, výběr buňky. */
  tap: 10,
  /** Varování — špatné číslo. */
  error: [30, 40, 30] as number[],
  /** Dokončení hry. */
  success: [50, 80, 40, 80, 120] as number[],
  /** Prohra (limit chyb). */
  fail: [100, 100, 200] as number[],
} as const;

type HapticPattern = keyof typeof HAPTIC_PATTERNS;

export function triggerHaptic(pattern: HapticPattern): void {
  if (typeof window === 'undefined') return;
  if (!useSettingsStore.getState().hapticsEnabled) return;
  if (typeof navigator.vibrate !== 'function') return;
  navigator.vibrate(HAPTIC_PATTERNS[pattern]);
}
