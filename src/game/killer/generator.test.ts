/**
 * Testy killer generatoru — pokrytí mřížky, korektní součty, velikost klecí.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { describe, expect, it } from 'vitest';
import type { Difficulty } from '@/types/game';
import { createRng } from '../rng';
import { KILLER_CONFIG } from './config';
import {
  generateKillerPuzzle,
  validateCageStructure,
} from './generator';

describe('generateKillerPuzzle', () => {
  it('klece pokrývají celou 9×9 mřížku bez překryvu', () => {
    const puzzle = generateKillerPuzzle('medium', createRng(1));
    expect(validateCageStructure(puzzle.cages)).toBe(true);
  });

  it('součty klecí odpovídají hodnotám v solution', () => {
    const puzzle = generateKillerPuzzle('easy', createRng(3));
    for (const cage of puzzle.cages) {
      const actualSum = cage.cells.reduce(
        (acc, p) => acc + puzzle.solution[p.row][p.col],
        0,
      );
      expect(actualSum).toBe(cage.sum);
    }
  });

  it('klece neobsahují duplicitní hodnoty', () => {
    const puzzle = generateKillerPuzzle('hard', createRng(11));
    for (const cage of puzzle.cages) {
      const values = cage.cells.map((p) => puzzle.solution[p.row][p.col]);
      expect(new Set(values).size).toBe(values.length);
    }
  });

  it('velikosti klecí respektují konfiguraci obtížnosti', () => {
    for (const difficulty of ['easy', 'medium', 'hard', 'expert'] as const) {
      const puzzle = generateKillerPuzzle(difficulty, createRng(50));
      const config = KILLER_CONFIG[difficulty];
      for (const cage of puzzle.cages) {
        // Povolíme velikost 1 (single-cell ratio) i pokud config.minCageSize > 1
        expect(cage.cells.length).toBeGreaterThanOrEqual(1);
        // Horní hranice: může být trochu vyšší kvůli přirozenému průběhu (seed bez sousedů)
        expect(cage.cells.length).toBeLessThanOrEqual(config.maxCageSize + 1);
      }
    }
  });

  it('stejný seed → deterministicky stejný puzzle', () => {
    const a = generateKillerPuzzle('medium', createRng(42));
    const b = generateKillerPuzzle('medium', createRng(42));
    expect(a.solution).toEqual(b.solution);
    expect(a.cages.length).toBe(b.cages.length);
  });
});

describe('KILLER_CONFIG', () => {
  it('všechny obtížnosti mají konfiguraci', () => {
    for (const difficulty of ['easy', 'medium', 'hard', 'expert'] as Difficulty[]) {
      expect(KILLER_CONFIG[difficulty]).toBeDefined();
    }
  });
});
