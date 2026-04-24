/**
 * Generátor sudoku zadání.
 * Postup:
 *   1. Vygeneruj kompletní náhodné řešení (fillDiagonalBlocks + solver s randomizací)
 *   2. Náhodně odeber buňky. Po každém odebrání ověř unikátnost řešení.
 *      Pokud by uniqueness padla, buňku vrať zpět.
 *   3. Zastav, jakmile počet zadaných buněk spadne pod maxClues dané obtížnosti,
 *      nebo když už žádnou další odebrat nejde.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import type { Difficulty, Grid } from '@/types/game';
import { BLOCK_SIZE, BOARD_SIZE, EMPTY_CELL } from './constants';
import { DIFFICULTY_CONFIG } from './difficulty';
import { cloneGrid, createEmptyGrid } from './grid';
import { defaultRng, shuffle, type Rng } from './rng';
import { countSolutions, solveInPlace } from './solver';

export interface Puzzle {
  /** Zadání — buňky s hodnotou 0 jsou prázdné. */
  puzzle: Grid;
  /** Plné, unikátní řešení zadání. */
  solution: Grid;
  /** Počet zadaných buněk v puzzle. */
  clueCount: number;
  /** Obtížnost, pro kterou bylo zadání vytvořeno. */
  difficulty: Difficulty;
}

/**
 * Naplní tři diagonální 3×3 bloky náhodnými permutacemi 1-9.
 * Diagonální bloky se navzájem nemohou omezit, takže následný solver má
 * mnoho valid dokončení a dá rychle náhodné plné řešení.
 */
function fillDiagonalBlocks(grid: Grid, rng: Rng): void {
  for (let b = 0; b < BOARD_SIZE; b += BLOCK_SIZE) {
    const values = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
    let idx = 0;
    for (let r = 0; r < BLOCK_SIZE; r++) {
      for (let c = 0; c < BLOCK_SIZE; c++) {
        grid[b + r][b + c] = values[idx++];
      }
    }
  }
}

/**
 * Vytvoří kompletně vyplněné valid sudoku řešení.
 * Stejný seed dá stejné řešení.
 */
export function generateFullGrid(rng: Rng = defaultRng): Grid {
  const grid = createEmptyGrid();
  fillDiagonalBlocks(grid, rng);
  const solved = solveInPlace(grid, rng);
  if (!solved) {
    throw new Error('generateFullGrid: solver selhal — nemělo by nastat');
  }
  return grid;
}

/** Všechny souřadnice buněk (row, col) v pseudo-náhodném pořadí. */
function shuffledCellPositions(rng: Rng): Array<[number, number]> {
  const positions: Array<[number, number]> = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      positions.push([r, c]);
    }
  }
  return shuffle(positions, rng);
}

/**
 * Vygeneruje zadání dané obtížnosti. Garantuje unikátní řešení.
 */
export function generatePuzzle(
  difficulty: Difficulty,
  rng: Rng = defaultRng,
): Puzzle {
  const config = DIFFICULTY_CONFIG[difficulty];
  const solution = generateFullGrid(rng);
  const puzzle = cloneGrid(solution);

  let clueCount = BOARD_SIZE * BOARD_SIZE;
  const positions = shuffledCellPositions(rng);

  for (const [row, col] of positions) {
    if (clueCount <= config.minClues) break;

    const backup = puzzle[row][col];
    puzzle[row][col] = EMPTY_CELL;

    if (countSolutions(puzzle, 2) === 1) {
      clueCount--;
      if (clueCount <= config.maxClues) {
        const shouldStop = clueCount <= config.maxClues && rng() < 0.3;
        if (shouldStop) break;
      }
    } else {
      puzzle[row][col] = backup;
    }
  }

  return {
    puzzle,
    solution,
    clueCount,
    difficulty,
  };
}
