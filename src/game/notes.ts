/**
 * Utility pro poznámky (kandidáty) v buňkách.
 * Operuje nad čistou Grid — samotný toggle poznámky na Board patří do UI storu.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import type { Grid } from '@/types/game';
import {
  BLOCK_SIZE,
  BOARD_SIZE,
  EMPTY_CELL,
  MAX_VALUE,
  MIN_VALUE,
} from './constants';

/**
 * Vrátí seznam hodnot, které lze do dané prázdné buňky vložit bez konfliktu.
 * Pro neprázdnou buňku vrací prázdné pole.
 */
export function getPossibleValues(
  grid: Grid,
  row: number,
  col: number,
): number[] {
  if (grid[row][col] !== EMPTY_CELL) return [];

  const used = new Set<number>();
  for (let i = 0; i < BOARD_SIZE; i++) {
    used.add(grid[row][i]);
    used.add(grid[i][col]);
  }
  const blockRow = Math.floor(row / BLOCK_SIZE) * BLOCK_SIZE;
  const blockCol = Math.floor(col / BLOCK_SIZE) * BLOCK_SIZE;
  for (let r = blockRow; r < blockRow + BLOCK_SIZE; r++) {
    for (let c = blockCol; c < blockCol + BLOCK_SIZE; c++) {
      used.add(grid[r][c]);
    }
  }

  const result: number[] = [];
  for (let v = MIN_VALUE; v <= MAX_VALUE; v++) {
    if (!used.has(v)) result.push(v);
  }
  return result;
}

/**
 * Spočítá automatické poznámky pro celou mřížku — pro každou prázdnou buňku
 * seznam hodnot, které by tam šly. Pro neprázdné buňky prázdné pole.
 */
export function computeAutoNotes(grid: Grid): number[][][] {
  const result: number[][][] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    const row: number[][] = [];
    for (let c = 0; c < BOARD_SIZE; c++) {
      row.push(getPossibleValues(grid, r, c));
    }
    result.push(row);
  }
  return result;
}
