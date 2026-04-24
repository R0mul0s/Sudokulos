/**
 * Testy killer solveru — řešitelnost, unikátnost, performance.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { describe, expect, it } from 'vitest';
import type { Cage } from '@/types/killer';
import { generateKillerPuzzle } from './generator';
import {
  countKillerSolutions,
  hasUniqueKillerSolution,
  solveKiller,
} from './solver';
import { createRng } from '../rng';
import { isGridSolved } from '../validator';

function cage(id: number, sum: number, cells: Array<[number, number]>): Cage {
  return { id, sum, cells: cells.map(([row, col]) => ({ row, col })) };
}

/** Vytvoří klece po 9 buňkách v řádku — triviální pokrytí pro testy. */
function rowsAsCages(sums: number[]): Cage[] {
  return sums.map((sum, rowIdx) =>
    cage(
      rowIdx + 1,
      sum,
      Array.from({ length: 9 }, (_, col) => [rowIdx, col] as [number, number]),
    ),
  );
}

describe('solveKiller', () => {
  it('vyřeší puzzle kde každý řádek je jedna klec (součet 45)', () => {
    const cages = rowsAsCages([45, 45, 45, 45, 45, 45, 45, 45, 45]);
    const solved = solveKiller(cages);
    expect(solved).not.toBeNull();
    expect(isGridSolved(solved!)).toBe(true);
  });

  it('vrátí null pro killer puzzle bez řešení', () => {
    // Součet 1 pro 2 buňky — pro unikátní čísla 1-9 není 2-buněčný součet 1
    const cages: Cage[] = [
      cage(1, 1, [[0, 0], [0, 1]]),
    ];
    // Doplníme zbytek triviální klecí aby splňovala pokrytí
    const rest: Array<[number, number]> = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (r === 0 && (c === 0 || c === 1)) continue;
        rest.push([r, c]);
      }
    }
    cages.push(cage(2, 400, rest));
    expect(solveKiller(cages)).toBeNull();
  });
});

describe('countKillerSolutions', () => {
  it('prázdné klece 9×45 mají víc než 1 řešení', () => {
    const cages = rowsAsCages([45, 45, 45, 45, 45, 45, 45, 45, 45]);
    expect(countKillerSolutions(cages, 2)).toBe(2);
    expect(hasUniqueKillerSolution(cages)).toBe(false);
  });
});

describe('generateKillerPuzzle', () => {
  it(
    'vytvoří puzzle s unikátním řešením pro všechny obtížnosti',
    { timeout: 30_000 },
    () => {
      for (const difficulty of ['easy', 'medium', 'hard', 'expert'] as const) {
        const puzzle = generateKillerPuzzle(difficulty, createRng(42));
        expect(hasUniqueKillerSolution(puzzle.cages)).toBe(true);
        expect(isGridSolved(puzzle.solution)).toBe(true);
      }
    },
  );

  it('solve(cages) vrátí stejné řešení jako puzzle.solution', () => {
    const puzzle = generateKillerPuzzle('medium', createRng(7));
    const solved = solveKiller(puzzle.cages);
    expect(solved).toEqual(puzzle.solution);
  });

  it(
    'generuje pod 10 s pro každou obtížnost',
    { timeout: 60_000 },
    () => {
      for (const difficulty of ['easy', 'medium', 'hard', 'expert'] as const) {
        const start = performance.now();
        generateKillerPuzzle(difficulty, createRng(100));
        const elapsed = performance.now() - start;
        expect(elapsed).toBeLessThan(10_000);
      }
    },
  );
});
