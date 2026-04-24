/**
 * Testy solveru — řešení, unikátnost, nevyřešitelná zadání.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { describe, expect, it } from 'vitest';
import { createEmptyGrid, gridsEqual, parseGrid } from './grid';
import { createRng } from './rng';
import {
  countSolutions,
  hasUniqueSolution,
  solve,
} from './solver';
import { isGridSolved } from './validator';

const EASY_PUZZLE =
  '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
const EASY_SOLUTION =
  '534678912672195348198342567859761423426853791713924856961537284287419635345286179';

const HARD_PUZZLE =
  '800000000003600000070090200050007000000045700000100030001000068008500010090000400';

describe('solve', () => {
  it('vyřeší jednoduché zadání', () => {
    const solved = solve(parseGrid(EASY_PUZZLE));
    expect(solved).not.toBeNull();
    expect(gridsEqual(solved!, parseGrid(EASY_SOLUTION))).toBe(true);
  });

  it('vyřeší hard zadání (Arto Inkala)', () => {
    const solved = solve(parseGrid(HARD_PUZZLE));
    expect(solved).not.toBeNull();
    expect(isGridSolved(solved!)).toBe(true);
  });

  it('vyřeší prázdnou mřížku (vrátí nějaké plné řešení)', () => {
    const solved = solve(createEmptyGrid());
    expect(solved).not.toBeNull();
    expect(isGridSolved(solved!)).toBe(true);
  });

  it('vrátí null pro zadání bez řešení', () => {
    const unsolvable = parseGrid(
      '120000000000000000000000000000000000000000000000000000000000000000000000000001200',
    );
    unsolvable[0][0] = 1;
    unsolvable[0][1] = 2;
    unsolvable[8][7] = 1;
    unsolvable[8][8] = 2;
    unsolvable[1][0] = 1;
    expect(solve(unsolvable)).toBeNull();
  });

  it('nemutuje vstupní mřížku', () => {
    const input = parseGrid(EASY_PUZZLE);
    const snapshot = input.map((row) => row.slice());
    solve(input);
    expect(input).toEqual(snapshot);
  });

  it('s deterministickým RNG dá stejné řešení', () => {
    const empty1 = createEmptyGrid();
    const empty2 = createEmptyGrid();
    const a = solve(empty1, createRng(42));
    const b = solve(empty2, createRng(42));
    expect(gridsEqual(a!, b!)).toBe(true);
  });
});

describe('countSolutions / hasUniqueSolution', () => {
  it('zadání s unikátním řešením vrátí 1', () => {
    expect(countSolutions(parseGrid(EASY_PUZZLE), 2)).toBe(1);
    expect(hasUniqueSolution(parseGrid(EASY_PUZZLE))).toBe(true);
  });

  it('prázdná mřížka má víc než 1 řešení', () => {
    expect(countSolutions(createEmptyGrid(), 2)).toBe(2);
    expect(hasUniqueSolution(createEmptyGrid())).toBe(false);
  });

  it('respektuje limit — nikdy nevrátí víc než limit', () => {
    expect(countSolutions(createEmptyGrid(), 1)).toBeLessThanOrEqual(1);
    expect(countSolutions(createEmptyGrid(), 5)).toBeLessThanOrEqual(5);
  });

  it('zadání bez řešení vrátí 0', () => {
    const grid = createEmptyGrid();
    grid[0][0] = 1;
    grid[0][1] = 1;
    expect(countSolutions(grid, 2)).toBe(0);
  });
});

describe('solver performance', () => {
  it('vyřeší 20 náhodných puzzle pod 500 ms v průměru', () => {
    const rng = createRng(2024);
    const start = performance.now();
    for (let i = 0; i < 20; i++) {
      const result = solve(createEmptyGrid(), rng);
      expect(result).not.toBeNull();
    }
    const elapsed = performance.now() - start;
    expect(elapsed / 20).toBeLessThan(500);
  });
});
