/**
 * Backtracking solver pro klasické sudoku.
 * - solve(): najde jedno řešení, nebo null pokud žádné neexistuje
 * - countSolutions(): spočítá řešení až do limitu (použití pro ověření unikátnosti)
 *
 * Optimalizace: vždy se vybírá buňka s nejmenším počtem kandidátů (MRV heuristika).
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
import { cloneGrid } from './grid';
import { shuffle, type Rng } from './rng';
import { isGridValid } from './validator';

interface CandidateMasks {
  rows: number[];
  cols: number[];
  blocks: number[];
}

/** Index bloku pro zadanou buňku (0-8). */
function blockIndex(row: number, col: number): number {
  return Math.floor(row / BLOCK_SIZE) * BLOCK_SIZE + Math.floor(col / BLOCK_SIZE);
}

/** Sestaví bitové masky obsazených hodnot pro každý řádek/sloupec/blok. */
function buildMasks(grid: Grid): CandidateMasks {
  const rows = new Array<number>(BOARD_SIZE).fill(0);
  const cols = new Array<number>(BOARD_SIZE).fill(0);
  const blocks = new Array<number>(BOARD_SIZE).fill(0);
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const v = grid[r][c];
      if (v !== EMPTY_CELL) {
        const bit = 1 << v;
        rows[r] |= bit;
        cols[c] |= bit;
        blocks[blockIndex(r, c)] |= bit;
      }
    }
  }
  return { rows, cols, blocks };
}

/** Počet nastavených bitů (Hammingova váha) — kolik hodnot je v dané masce obsazeno. */
function popcount(x: number): number {
  let n = x;
  n = n - ((n >> 1) & 0x55555555);
  n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
  return (((n + (n >> 4)) & 0x0f0f0f0f) * 0x01010101) >> 24;
}

/**
 * Najde prázdnou buňku s nejmenším počtem možných hodnot.
 * Vrací null pokud žádná prázdná buňka není.
 */
function findBestCell(grid: Grid, masks: CandidateMasks): {
  row: number;
  col: number;
  candidates: number;
} | null {
  let best: { row: number; col: number; candidates: number } | null = null;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (grid[r][c] !== EMPTY_CELL) continue;
      const used = masks.rows[r] | masks.cols[c] | masks.blocks[blockIndex(r, c)];
      const candidates = BOARD_SIZE - popcount(used & 0b1111111110);
      if (candidates === 0) return { row: r, col: c, candidates: 0 };
      if (best === null || candidates < best.candidates) {
        best = { row: r, col: c, candidates };
        if (candidates === 1) return best;
      }
    }
  }
  return best;
}

/** Rekurzivní backtracking — naplní grid in-place. Vrátí true při úspěchu. */
function backtrack(grid: Grid, masks: CandidateMasks, rng?: Rng): boolean {
  const cell = findBestCell(grid, masks);
  if (cell === null) return true;
  if (cell.candidates === 0) return false;

  const { row, col } = cell;
  const blk = blockIndex(row, col);
  const used = masks.rows[row] | masks.cols[col] | masks.blocks[blk];

  const values: number[] = [];
  for (let v = MIN_VALUE; v <= MAX_VALUE; v++) {
    if ((used & (1 << v)) === 0) values.push(v);
  }
  const ordered = rng ? shuffle(values, rng) : values;

  for (const v of ordered) {
    const bit = 1 << v;
    grid[row][col] = v;
    masks.rows[row] |= bit;
    masks.cols[col] |= bit;
    masks.blocks[blk] |= bit;

    if (backtrack(grid, masks, rng)) return true;

    grid[row][col] = EMPTY_CELL;
    masks.rows[row] &= ~bit;
    masks.cols[col] &= ~bit;
    masks.blocks[blk] &= ~bit;
  }

  return false;
}

/**
 * Vyřeší mřížku. Vrátí nové řešení, nebo null pokud neexistuje.
 * Pokud je zadán rng, řešení je náhodně vybrané z možných (použití v generátoru).
 */
export function solve(grid: Grid, rng?: Rng): Grid | null {
  if (!isGridValid(grid)) return null;
  const working = cloneGrid(grid);
  const masks = buildMasks(working);
  if (!backtrack(working, masks, rng)) return null;
  return working;
}

/** In-place varianta — mutuje vstupní mřížku. Pro interní použití v generátoru. */
export function solveInPlace(grid: Grid, rng?: Rng): boolean {
  if (!isGridValid(grid)) return false;
  const masks = buildMasks(grid);
  return backtrack(grid, masks, rng);
}

/**
 * Spočítá počet řešení, ale zastaví se po dosažení limitu.
 * Pro ověření unikátnosti stačí zavolat s limit=2 — vrátí 0, 1 nebo 2.
 */
export function countSolutions(grid: Grid, limit = 2): number {
  if (!isGridValid(grid)) return 0;
  const working = cloneGrid(grid);
  const masks = buildMasks(working);
  let count = 0;

  const recurse = (): void => {
    if (count >= limit) return;
    const cell = findBestCell(working, masks);
    if (cell === null) {
      count++;
      return;
    }
    if (cell.candidates === 0) return;

    const { row, col } = cell;
    const blk = blockIndex(row, col);
    const used = masks.rows[row] | masks.cols[col] | masks.blocks[blk];

    for (let v = MIN_VALUE; v <= MAX_VALUE; v++) {
      if ((used & (1 << v)) !== 0) continue;
      const bit = 1 << v;
      working[row][col] = v;
      masks.rows[row] |= bit;
      masks.cols[col] |= bit;
      masks.blocks[blk] |= bit;

      recurse();

      working[row][col] = EMPTY_CELL;
      masks.rows[row] &= ~bit;
      masks.cols[col] &= ~bit;
      masks.blocks[blk] &= ~bit;

      if (count >= limit) return;
    }
  };

  recurse();
  return count;
}

/** True pokud má zadání právě jedno řešení. */
export function hasUniqueSolution(grid: Grid): boolean {
  return countSolutions(grid, 2) === 1;
}
