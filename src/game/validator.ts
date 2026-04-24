/**
 * Validace sudoku mřížky — kontrola řádku, sloupce a 3×3 bloku.
 * Všechny funkce jsou čistě funkční, nemutují vstup.
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

export interface Position {
  row: number;
  col: number;
}

/**
 * Ověří, zda lze vložit hodnotu do buňky bez porušení pravidel sudoku.
 * Ignoruje samotnou buňku (tj. stejnou pozici), aby šla volat i pro už vyplněné buňky.
 */
export function isValidPlacement(
  grid: Grid,
  row: number,
  col: number,
  value: number,
): boolean {
  if (value < MIN_VALUE || value > MAX_VALUE) return false;

  for (let i = 0; i < BOARD_SIZE; i++) {
    if (i !== col && grid[row][i] === value) return false;
    if (i !== row && grid[i][col] === value) return false;
  }

  const blockRow = Math.floor(row / BLOCK_SIZE) * BLOCK_SIZE;
  const blockCol = Math.floor(col / BLOCK_SIZE) * BLOCK_SIZE;
  for (let r = blockRow; r < blockRow + BLOCK_SIZE; r++) {
    for (let c = blockCol; c < blockCol + BLOCK_SIZE; c++) {
      if ((r !== row || c !== col) && grid[r][c] === value) return false;
    }
  }

  return true;
}

/**
 * Vrátí všechny pozice, které jsou v konfliktu (porušují pravidlo řádku, sloupce nebo bloku).
 * Prázdné buňky se ignorují. Každá konfliktní pozice je v seznamu jen jednou.
 */
export function findConflicts(grid: Grid): Position[] {
  const conflicts = new Set<string>();

  const markIfDuplicates = (cells: Position[]): void => {
    const seen = new Map<number, Position[]>();
    for (const pos of cells) {
      const value = grid[pos.row][pos.col];
      if (value === EMPTY_CELL) continue;
      const list = seen.get(value);
      if (list) list.push(pos);
      else seen.set(value, [pos]);
    }
    for (const list of seen.values()) {
      if (list.length > 1) {
        for (const p of list) conflicts.add(`${p.row},${p.col}`);
      }
    }
  };

  for (let i = 0; i < BOARD_SIZE; i++) {
    const rowCells: Position[] = [];
    const colCells: Position[] = [];
    for (let j = 0; j < BOARD_SIZE; j++) {
      rowCells.push({ row: i, col: j });
      colCells.push({ row: j, col: i });
    }
    markIfDuplicates(rowCells);
    markIfDuplicates(colCells);
  }

  for (let br = 0; br < BOARD_SIZE; br += BLOCK_SIZE) {
    for (let bc = 0; bc < BOARD_SIZE; bc += BLOCK_SIZE) {
      const blockCells: Position[] = [];
      for (let r = br; r < br + BLOCK_SIZE; r++) {
        for (let c = bc; c < bc + BLOCK_SIZE; c++) {
          blockCells.push({ row: r, col: c });
        }
      }
      markIfDuplicates(blockCells);
    }
  }

  return Array.from(conflicts, (key) => {
    const [row, col] = key.split(',').map(Number);
    return { row, col };
  });
}

/** True pokud jsou všechny buňky vyplněné (hodnotou 1-9). */
export function isGridComplete(grid: Grid): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (grid[r][c] === EMPTY_CELL) return false;
    }
  }
  return true;
}

/** True pokud mřížka neobsahuje žádný konflikt (může být nekompletní). */
export function isGridValid(grid: Grid): boolean {
  return findConflicts(grid).length === 0;
}

/** True pokud je mřížka kompletně vyplněná a bez konfliktů. */
export function isGridSolved(grid: Grid): boolean {
  return isGridComplete(grid) && isGridValid(grid);
}
