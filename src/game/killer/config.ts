/**
 * Konfigurace killer sudoku generátoru — rozsah velikostí klecí per obtížnost.
 *
 * Větší klece = méně omezení = těžší logická dedukce.
 * Menší klece (1-2) = silné constraints = snazší.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import type { Difficulty } from '@/types/game';

export interface KillerConfig {
  /** Nejmenší povolená velikost klece (neuvažují se výsledné 1-buněčné zbytky, ty se vždy vytvoří). */
  minCageSize: number;
  /** Horní mez velikosti klece — generátor se jí drží jako soft limit. */
  maxCageSize: number;
  /** Kolik procent buněk má být v klecích velikosti 1 (nápovědy pro snadnost). */
  singleCellRatio: number;
}

export const KILLER_CONFIG: Record<Difficulty, KillerConfig> = {
  easy: {
    minCageSize: 2,
    maxCageSize: 2,
    singleCellRatio: 0.15,
  },
  medium: {
    minCageSize: 2,
    maxCageSize: 3,
    singleCellRatio: 0.05,
  },
  hard: {
    minCageSize: 2,
    maxCageSize: 4,
    singleCellRatio: 0,
  },
  expert: {
    minCageSize: 2,
    maxCageSize: 4,
    singleCellRatio: 0,
  },
};
