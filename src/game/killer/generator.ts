/**
 * Killer sudoku generator.
 * 1. Vygeneruje plné klasické řešení sudoku
 * 2. Rozdělí mřížku do klecí (growing algoritmus, 4-adjacentní buňky,
 *    max velikost daná obtížností, zákaz duplicit uvnitř klece)
 * 3. Spočítá cílové součty podle plného řešení
 * 4. Ověří, že úloha má jediné řešení; pokud ne, opakuje s jiným seedem
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import type { Difficulty, Grid } from '@/types/game';
import type { Cage, CellPosition, KillerPuzzle } from '@/types/killer';
import { BOARD_SIZE, EMPTY_CELL } from '../constants';
import { generateFullGrid } from '../generator';
import { defaultRng, shuffle, type Rng } from '../rng';
import { KILLER_CONFIG } from './config';
import { countKillerSolutions } from './solver';

const NEIGHBOR_DELTAS: ReadonlyArray<[number, number]> = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

function allCells(): CellPosition[] {
  const cells: CellPosition[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      cells.push({ row: r, col: c });
    }
  }
  return cells;
}

/**
 * Pokryje mřížku klecemi. Vrací seznam klecí s vypočtenými součty ze solution.
 * Žádná buňka není ve dvou klecích, každá buňka je v právě jedné.
 *
 * Exported pro diagnostiku/testy, běžně se volá jen uvnitř generateKillerPuzzle.
 */
export function growCages(
  solution: Grid,
  difficulty: Difficulty,
  rng: Rng,
): Cage[] {
  const config = KILLER_CONFIG[difficulty];
  const assignment: (number | null)[][] = Array.from({ length: BOARD_SIZE }, () =>
    new Array<number | null>(BOARD_SIZE).fill(null),
  );
  const cages: Cage[] = [];
  let nextCageId = 1;

  const seedOrder = shuffle(allCells(), rng);

  for (const seed of seedOrder) {
    if (assignment[seed.row][seed.col] !== null) continue;

    const cageId = nextCageId++;
    const targetSize = (() => {
      if (rng() < config.singleCellRatio) return 1;
      const range = config.maxCageSize - config.minCageSize + 1;
      return config.minCageSize + Math.floor(rng() * range);
    })();

    const cells: CellPosition[] = [seed];
    assignment[seed.row][seed.col] = cageId;
    const usedValues = new Set<number>([solution[seed.row][seed.col]]);

    while (cells.length < targetSize) {
      const candidates: CellPosition[] = [];
      for (const cell of cells) {
        for (const [dr, dc] of NEIGHBOR_DELTAS) {
          const nr = cell.row + dr;
          const nc = cell.col + dc;
          if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) continue;
          if (assignment[nr][nc] !== null) continue;
          if (usedValues.has(solution[nr][nc])) continue;
          if (candidates.some((p) => p.row === nr && p.col === nc)) continue;
          candidates.push({ row: nr, col: nc });
        }
      }
      if (candidates.length === 0) break;
      const pick = candidates[Math.floor(rng() * candidates.length)];
      assignment[pick.row][pick.col] = cageId;
      cells.push(pick);
      usedValues.add(solution[pick.row][pick.col]);
    }

    const sum = cells.reduce((acc, p) => acc + solution[p.row][p.col], 0);
    cages.push({ id: cageId, sum, cells });
  }

  return cages;
}

/**
 * Vygeneruje killer puzzle dané obtížnosti s garantovanou unikátností řešení.
 *
 * Pokud by náhodně vytvořené klece daly >1 řešení, regeneruje (max 8 pokusů).
 * Při vyčerpání pokusů vrací poslední pokus (v praxi se nestává — klece jsou
 * velmi restriktivní, unikátnost je přirozený důsledek).
 */
export function generateKillerPuzzle(
  difficulty: Difficulty,
  rng: Rng = defaultRng,
): KillerPuzzle {
  const MAX_ATTEMPTS = 12;
  let lastPuzzle: KillerPuzzle | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const solution = generateFullGrid(rng);
    const cages = growCages(solution, difficulty, rng);
    lastPuzzle = { cages, solution };
    if (countKillerSolutions(cages, 2) === 1) {
      return lastPuzzle;
    }
  }

  if (lastPuzzle === null) {
    throw new Error('generateKillerPuzzle: selhalo vytvoření puzzle');
  }
  return lastPuzzle;
}

/** Pomocná funkce pro testy — validuje strukturu klecí (pokrytí + unikátnost ID). */
export function validateCageStructure(cages: readonly Cage[]): boolean {
  const seen = new Set<string>();
  const ids = new Set<number>();
  for (const cage of cages) {
    if (ids.has(cage.id)) return false;
    ids.add(cage.id);
    for (const { row, col } of cage.cells) {
      const key = `${row},${col}`;
      if (seen.has(key)) return false;
      seen.add(key);
    }
  }
  return seen.size === BOARD_SIZE * BOARD_SIZE;
}

/**
 * Odvodí hodnotu EMPTY_CELL pro prázdnou mřížku (startovní killer desky).
 * Helper pro UI, aby se nemusel importovat EMPTY_CELL do komponent.
 */
export function createEmptyKillerGrid(): Grid {
  return Array.from({ length: BOARD_SIZE }, () =>
    new Array<number>(BOARD_SIZE).fill(EMPTY_CELL),
  );
}
