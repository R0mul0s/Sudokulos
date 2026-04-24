/**
 * Utility pro manipulaci s čistou numerickou mřížkou (Grid).
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import type { Grid } from '@/types/game';
import { BOARD_SIZE, EMPTY_CELL } from './constants';

/** Vytvoří prázdnou 9×9 mřížku vyplněnou EMPTY_CELL. */
export function createEmptyGrid(): Grid {
  return Array.from({ length: BOARD_SIZE }, () =>
    new Array<number>(BOARD_SIZE).fill(EMPTY_CELL),
  );
}

/** Hluboká kopie mřížky. */
export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.slice());
}

/**
 * Porovná dvě mřížky na shodu hodnot.
 */
export function gridsEqual(a: Grid, b: Grid): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

/**
 * Parsuje textovou reprezentaci mřížky (81 znaků — 1-9 pro hodnoty, cokoli jiného pro prázdné buňky).
 * Užitečné pro fixtury v testech.
 */
export function parseGrid(input: string): Grid {
  const chars = input.replace(/\s/g, '');
  if (chars.length !== BOARD_SIZE * BOARD_SIZE) {
    throw new Error(
      `parseGrid očekává ${BOARD_SIZE * BOARD_SIZE} znaků, dostalo ${chars.length}`,
    );
  }
  const grid = createEmptyGrid();
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const value = ch >= '1' && ch <= '9' ? Number(ch) : EMPTY_CELL;
    grid[Math.floor(i / BOARD_SIZE)][i % BOARD_SIZE] = value;
  }
  return grid;
}

/**
 * Serializuje mřížku do textové podoby — řádky oddělené \n, prázdná buňka jako tečka.
 */
export function formatGrid(grid: Grid): string {
  return grid
    .map((row) => row.map((v) => (v === EMPTY_CELL ? '.' : String(v))).join(''))
    .join('\n');
}

/** Spočítá počet neprázdných (zadaných nebo vyplněných) buněk. */
export function countFilled(grid: Grid): number {
  let count = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (grid[r][c] !== EMPTY_CELL) count++;
    }
  }
  return count;
}
