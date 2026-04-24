/**
 * Killer sudoku solver — rozšíření backtrackingu o cage constraint (součet + unikátnost).
 * Používá MRV heuristiku (buňka s nejmenším počtem kandidátů) a bitmasky
 * pro rychlé testování, které hodnoty jsou již v řádku/sloupci/bloku/kleci použité.
 *
 * Implementace používá ploché číselné buffery (žádné Map), aby hot-path v backtrackingu
 * neplatil za hashovací overhead. Klece se indexují 0-based kontinuálně
 * (nezávisle na cage.id, které je 1-based).
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import type { Grid } from '@/types/game';
import type { Cage } from '@/types/killer';
import {
  BLOCK_SIZE,
  BOARD_SIZE,
  EMPTY_CELL,
  MAX_VALUE,
  MIN_VALUE,
} from '../constants';
import { cloneGrid, createEmptyGrid } from '../grid';
import { shuffle, type Rng } from '../rng';

const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;
const VALUE_MASK = 0b1111111110;

interface KillerState {
  rows: number[];
  cols: number[];
  blocks: number[];
  /** Maska použitých hodnot v kleci, indexováno 0-based pořadím v poli cages. */
  cageUsed: number[];
  cageSum: number[];
  cageFilled: number[];
  cageTarget: number[];
  cageSize: number[];
  /** Index klece pro buňku (row * 9 + col); -1 pokud buňka není v žádné kleci. */
  cellToCage: Int8Array;
}

function blockIndex(row: number, col: number): number {
  return (
    Math.floor(row / BLOCK_SIZE) * BLOCK_SIZE + Math.floor(col / BLOCK_SIZE)
  );
}

function popcount(x: number): number {
  let n = x;
  n = n - ((n >> 1) & 0x55555555);
  n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
  return (((n + (n >> 4)) & 0x0f0f0f0f) * 0x01010101) >> 24;
}

function initState(grid: Grid, cages: readonly Cage[]): KillerState {
  const cageUsed = new Array<number>(cages.length).fill(0);
  const cageSum = new Array<number>(cages.length).fill(0);
  const cageFilled = new Array<number>(cages.length).fill(0);
  const cageTarget = new Array<number>(cages.length).fill(0);
  const cageSize = new Array<number>(cages.length).fill(0);
  const cellToCage = new Int8Array(CELL_COUNT).fill(-1);

  for (let i = 0; i < cages.length; i++) {
    const cage = cages[i];
    cageTarget[i] = cage.sum;
    cageSize[i] = cage.cells.length;
    for (const { row, col } of cage.cells) {
      cellToCage[row * BOARD_SIZE + col] = i;
    }
  }

  const rows = new Array<number>(BOARD_SIZE).fill(0);
  const cols = new Array<number>(BOARD_SIZE).fill(0);
  const blocks = new Array<number>(BOARD_SIZE).fill(0);

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const v = grid[r][c];
      if (v === EMPTY_CELL) continue;
      const bit = 1 << v;
      rows[r] |= bit;
      cols[c] |= bit;
      blocks[blockIndex(r, c)] |= bit;
      const ci = cellToCage[r * BOARD_SIZE + c];
      if (ci !== -1) {
        cageUsed[ci] |= bit;
        cageSum[ci] += v;
        cageFilled[ci] += 1;
      }
    }
  }

  return {
    rows,
    cols,
    blocks,
    cageUsed,
    cageSum,
    cageFilled,
    cageTarget,
    cageSize,
    cellToCage,
  };
}

/** Součet N nejmenších hodnot dostupných v masce (bity 1-9). */
function minSumOfN(availMask: number, n: number): number {
  if (n <= 0) return 0;
  let sum = 0;
  let count = 0;
  for (let v = MIN_VALUE; v <= MAX_VALUE && count < n; v++) {
    if ((availMask & (1 << v)) !== 0) {
      sum += v;
      count++;
    }
  }
  return count < n ? Number.MAX_SAFE_INTEGER : sum;
}

/** Součet N největších hodnot dostupných v masce. */
function maxSumOfN(availMask: number, n: number): number {
  if (n <= 0) return 0;
  let sum = 0;
  let count = 0;
  for (let v = MAX_VALUE; v >= MIN_VALUE && count < n; v--) {
    if ((availMask & (1 << v)) !== 0) {
      sum += v;
      count++;
    }
  }
  return count < n ? -1 : sum;
}

/** Vrátí bitmasku kandidátů pro buňku (bity 1-9 = možná hodnota). */
function candidates(state: KillerState, row: number, col: number): number {
  let forbidden =
    state.rows[row] | state.cols[col] | state.blocks[blockIndex(row, col)];

  const ci = state.cellToCage[row * BOARD_SIZE + col];
  if (ci !== -1) {
    const cageUsedMask = state.cageUsed[ci];
    forbidden |= cageUsedMask;
    const currentSum = state.cageSum[ci];
    const remainingAfter = state.cageSize[ci] - state.cageFilled[ci] - 1;
    const cageTarget = state.cageTarget[ci];
    const availForRest = ~cageUsedMask & VALUE_MASK;

    for (let v = MIN_VALUE; v <= MAX_VALUE; v++) {
      const bit = 1 << v;
      if ((forbidden & bit) !== 0) continue;
      const tentative = currentSum + v;
      if (remainingAfter === 0) {
        if (tentative !== cageTarget) forbidden |= bit;
        continue;
      }
      const restMask = availForRest & ~bit;
      const minRest = minSumOfN(restMask, remainingAfter);
      const maxRest = maxSumOfN(restMask, remainingAfter);
      if (tentative + minRest > cageTarget) forbidden |= bit;
      else if (tentative + maxRest < cageTarget) forbidden |= bit;
    }
  }

  return ~forbidden & VALUE_MASK;
}

function findBestCell(
  grid: Grid,
  state: KillerState,
): { row: number; col: number; mask: number } | null {
  let best: { row: number; col: number; mask: number } | null = null;
  let bestCount = MAX_VALUE + 1;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (grid[r][c] !== EMPTY_CELL) continue;
      const mask = candidates(state, r, c);
      const count = popcount(mask);
      if (count === 0) return { row: r, col: c, mask: 0 };
      if (count < bestCount) {
        bestCount = count;
        best = { row: r, col: c, mask };
        if (count === 1) return best;
      }
    }
  }
  return best;
}

function placeValue(
  grid: Grid,
  state: KillerState,
  row: number,
  col: number,
  value: number,
): void {
  const bit = 1 << value;
  grid[row][col] = value;
  state.rows[row] |= bit;
  state.cols[col] |= bit;
  state.blocks[blockIndex(row, col)] |= bit;
  const ci = state.cellToCage[row * BOARD_SIZE + col];
  if (ci !== -1) {
    state.cageUsed[ci] |= bit;
    state.cageSum[ci] += value;
    state.cageFilled[ci] += 1;
  }
}

function unplaceValue(
  grid: Grid,
  state: KillerState,
  row: number,
  col: number,
  value: number,
): void {
  const bit = 1 << value;
  grid[row][col] = EMPTY_CELL;
  state.rows[row] &= ~bit;
  state.cols[col] &= ~bit;
  state.blocks[blockIndex(row, col)] &= ~bit;
  const ci = state.cellToCage[row * BOARD_SIZE + col];
  if (ci !== -1) {
    state.cageUsed[ci] &= ~bit;
    state.cageSum[ci] -= value;
    state.cageFilled[ci] -= 1;
  }
}

function backtrack(grid: Grid, state: KillerState, rng?: Rng): boolean {
  const cell = findBestCell(grid, state);
  if (cell === null) return true;
  if (cell.mask === 0) return false;

  const values: number[] = [];
  for (let v = MIN_VALUE; v <= MAX_VALUE; v++) {
    if ((cell.mask & (1 << v)) !== 0) values.push(v);
  }
  const ordered = rng ? shuffle(values, rng) : values;

  for (const v of ordered) {
    placeValue(grid, state, cell.row, cell.col, v);
    if (backtrack(grid, state, rng)) return true;
    unplaceValue(grid, state, cell.row, cell.col, v);
  }
  return false;
}

function countBacktrack(
  grid: Grid,
  state: KillerState,
  limit: number,
  counter: { count: number },
): void {
  if (counter.count >= limit) return;
  const cell = findBestCell(grid, state);
  if (cell === null) {
    counter.count++;
    return;
  }
  if (cell.mask === 0) return;

  for (let v = MIN_VALUE; v <= MAX_VALUE; v++) {
    if ((cell.mask & (1 << v)) === 0) continue;
    placeValue(grid, state, cell.row, cell.col, v);
    countBacktrack(grid, state, limit, counter);
    unplaceValue(grid, state, cell.row, cell.col, v);
    if (counter.count >= limit) return;
  }
}

/**
 * Vyřeší killer puzzle (prázdná mřížka + klece). Vrátí plné řešení, nebo null.
 */
export function solveKiller(cages: readonly Cage[], rng?: Rng): Grid | null {
  const grid = createEmptyGrid();
  const state = initState(grid, cages);
  if (!backtrack(grid, state, rng)) return null;
  return grid;
}

/**
 * Spočítá počet řešení (až do limitu). Pro ověření unikátnosti stačí limit=2.
 */
export function countKillerSolutions(
  cages: readonly Cage[],
  limit = 2,
): number {
  const grid = createEmptyGrid();
  const state = initState(grid, cages);
  const counter = { count: 0 };
  countBacktrack(grid, state, limit, counter);
  return counter.count;
}

/** True pokud killer puzzle má právě jedno řešení. */
export function hasUniqueKillerSolution(cages: readonly Cage[]): boolean {
  return countKillerSolutions(cages, 2) === 1;
}

/**
 * Pokračuje v řešení z již částečně vyplněné mřížky — užitečné pro ověření
 * uživatelova progressu nebo pro hint.
 */
export function solveKillerFrom(
  grid: Grid,
  cages: readonly Cage[],
  rng?: Rng,
): Grid | null {
  const working = cloneGrid(grid);
  const state = initState(working, cages);
  if (!backtrack(working, state, rng)) return null;
  return working;
}
