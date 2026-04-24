/**
 * Validace killer sudoku — kontrola součtů v klecích a unikátnosti čísel
 * uvnitř klece (navíc k pravidlům klasického sudoku).
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import type { Cage, CellPosition } from '@/types/killer';
import type { Grid } from '@/types/game';
import { BOARD_SIZE, EMPTY_CELL } from '../constants';

/**
 * Mapa souřadnice → id klece. Rychlý lookup zda buňka patří do konkrétní klece.
 */
export function buildCageLookup(cages: readonly Cage[]): (number | null)[][] {
  const lookup: (number | null)[][] = Array.from({ length: BOARD_SIZE }, () =>
    new Array<number | null>(BOARD_SIZE).fill(null),
  );
  for (const cage of cages) {
    for (const { row, col } of cage.cells) {
      lookup[row][col] = cage.id;
    }
  }
  return lookup;
}

/**
 * Ověří že klece pokrývají celou mřížku přesně jednou.
 */
export function areCagesComplete(cages: readonly Cage[]): boolean {
  const seen = new Set<string>();
  for (const cage of cages) {
    for (const { row, col } of cage.cells) {
      const key = `${row},${col}`;
      if (seen.has(key)) return false;
      seen.add(key);
    }
  }
  return seen.size === BOARD_SIZE * BOARD_SIZE;
}

/**
 * Vrátí konfliktní buňky v klecích:
 *   - duplicitní hodnota uvnitř klece
 *   - součet klece je překročen nebo (u dokončené klece) se neshoduje s target
 */
export function findCageConflicts(
  grid: Grid,
  cages: readonly Cage[],
): CellPosition[] {
  const conflicts = new Set<string>();

  for (const cage of cages) {
    const seenValues = new Map<number, CellPosition[]>();
    let filled = 0;
    let sum = 0;
    for (const pos of cage.cells) {
      const v = grid[pos.row][pos.col];
      if (v === EMPTY_CELL) continue;
      filled++;
      sum += v;
      const list = seenValues.get(v);
      if (list) list.push(pos);
      else seenValues.set(v, [pos]);
    }

    // Duplicity uvnitř klece
    for (const list of seenValues.values()) {
      if (list.length > 1) {
        for (const p of list) conflicts.add(`${p.row},${p.col}`);
      }
    }

    // Součet klece
    if (sum > cage.sum || (filled === cage.cells.length && sum !== cage.sum)) {
      for (const pos of cage.cells) {
        const v = grid[pos.row][pos.col];
        if (v !== EMPTY_CELL) conflicts.add(`${pos.row},${pos.col}`);
      }
    }
  }

  return Array.from(conflicts, (key) => {
    const [row, col] = key.split(',').map(Number);
    return { row, col };
  });
}

/**
 * Ověří, zda lze vložit hodnotu do buňky bez porušení klec pravidel
 * (unikátnost + nepřeplnění součtu). Neřeší pravidla klasického sudoku —
 * ta se kontrolují samostatně přes validator z klasiky.
 */
export function isValidKillerPlacement(
  grid: Grid,
  cages: readonly Cage[],
  lookup: (number | null)[][],
  row: number,
  col: number,
  value: number,
): boolean {
  const cageId = lookup[row][col];
  if (cageId === null) return true;
  const cage = cages.find((c) => c.id === cageId);
  if (!cage) return true;

  let sum = value;
  let emptyAfter = 0;
  for (const pos of cage.cells) {
    if (pos.row === row && pos.col === col) continue;
    const v = grid[pos.row][pos.col];
    if (v === EMPTY_CELL) {
      emptyAfter++;
      continue;
    }
    if (v === value) return false;
    sum += v;
  }

  if (emptyAfter === 0) return sum === cage.sum;
  return sum < cage.sum;
}
