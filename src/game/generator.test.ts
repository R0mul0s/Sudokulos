/**
 * Testy generátoru — validita, unikátnost, obtížnosti, výkon.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { describe, expect, it } from 'vitest';
import type { Difficulty } from '@/types/game';
import { DIFFICULTY_CONFIG } from './difficulty';
import { generateFullGrid, generatePuzzle } from './generator';
import { countFilled } from './grid';
import { createRng } from './rng';
import { hasUniqueSolution } from './solver';
import { isGridSolved, isGridValid } from './validator';

describe('generateFullGrid', () => {
  it('vrací validní vyřešenou mřížku', () => {
    const grid = generateFullGrid(createRng(1));
    expect(isGridSolved(grid)).toBe(true);
  });

  it('stejný seed → stejná mřížka', () => {
    const a = generateFullGrid(createRng(42));
    const b = generateFullGrid(createRng(42));
    expect(a).toEqual(b);
  });

  it('různé seedy dají různé mřížky', () => {
    const a = generateFullGrid(createRng(1));
    const b = generateFullGrid(createRng(999));
    expect(a).not.toEqual(b);
  });
});

describe('generatePuzzle', () => {
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

  for (const difficulty of difficulties) {
    describe(`obtížnost: ${difficulty}`, () => {
      it('vrací validní zadání s unikátním řešením', () => {
        const { puzzle, solution } = generatePuzzle(difficulty, createRng(1));
        expect(isGridValid(puzzle)).toBe(true);
        expect(isGridSolved(solution)).toBe(true);
        expect(hasUniqueSolution(puzzle)).toBe(true);
      });

      it('počet zadaných buněk je v rozsahu konfigu', () => {
        const { clueCount } = generatePuzzle(difficulty, createRng(7));
        const config = DIFFICULTY_CONFIG[difficulty];
        expect(clueCount).toBeGreaterThanOrEqual(config.minClues);
        expect(clueCount).toBeLessThanOrEqual(config.maxClues + 3);
      });

      it('řešení obsahuje všechny zadané buňky', () => {
        const { puzzle, solution } = generatePuzzle(difficulty, createRng(3));
        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            if (puzzle[r][c] !== 0) {
              expect(puzzle[r][c]).toBe(solution[r][c]);
            }
          }
        }
      });
    });
  }

  it('clueCount odpovídá countFilled(puzzle)', () => {
    const { puzzle, clueCount } = generatePuzzle('medium', createRng(5));
    expect(countFilled(puzzle)).toBe(clueCount);
  });

  it('generování pod 2s pro každou obtížnost', () => {
    for (const difficulty of ['easy', 'medium', 'hard', 'expert'] as const) {
      const start = performance.now();
      generatePuzzle(difficulty, createRng(100));
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(2000);
    }
  });
});
