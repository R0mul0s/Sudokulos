/**
 * Konfigurace obtížnosti — počet zadaných buněk pro každý level.
 * Rozsah, nikoli jedno konkrétní číslo, aby generátor mohl zastavit, jakmile
 * narazí na buňku, kterou nejde odebrat bez ztráty unikátnosti řešení.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import type { Difficulty } from '@/types/game';

export interface DifficultyConfig {
  /** Horní mez počtu zadaných buněk — generátor se pokusí dostat pod ni. */
  maxClues: number;
  /** Spodní mez — pod tuto hodnotu generátor nejde, i kdyby uniqueness držela. */
  minClues: number;
  /** Maximální čas na vygenerování v ms (soft limit pro monitoring). */
  targetGenerationMs: number;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    maxClues: 45,
    minClues: 40,
    targetGenerationMs: 200,
  },
  medium: {
    maxClues: 36,
    minClues: 32,
    targetGenerationMs: 300,
  },
  hard: {
    maxClues: 31,
    minClues: 28,
    targetGenerationMs: 500,
  },
  expert: {
    maxClues: 27,
    minClues: 24,
    targetGenerationMs: 1000,
  },
};

export const DIFFICULTY_ORDER: readonly Difficulty[] = [
  'easy',
  'medium',
  'hard',
  'expert',
] as const;
