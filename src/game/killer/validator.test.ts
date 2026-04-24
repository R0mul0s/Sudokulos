/**
 * Testy killer validatoru — sjednocení klecí, konflikty, placement.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { describe, expect, it } from 'vitest';
import type { Cage } from '@/types/killer';
import { createEmptyGrid } from '../grid';
import {
  areCagesComplete,
  buildCageLookup,
  findCageConflicts,
  isValidKillerPlacement,
} from './validator';

function trivialCage(id: number, sum: number, cells: Array<[number, number]>): Cage {
  return {
    id,
    sum,
    cells: cells.map(([row, col]) => ({ row, col })),
  };
}

describe('areCagesComplete', () => {
  it('vrací false pokud klece nepokryjí celou mřížku', () => {
    expect(areCagesComplete([trivialCage(1, 1, [[0, 0]])])).toBe(false);
  });

  it('vrací false pokud se klece překrývají', () => {
    const cells: Array<[number, number]> = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) cells.push([r, c]);
    }
    const cages = [trivialCage(1, 405, cells), trivialCage(2, 1, [[0, 0]])];
    expect(areCagesComplete(cages)).toBe(false);
  });

  it('vrací true pro jedinou klec pokrývající celou mřížku', () => {
    const cells: Array<[number, number]> = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) cells.push([r, c]);
    }
    expect(areCagesComplete([trivialCage(1, 405, cells)])).toBe(true);
  });
});

describe('buildCageLookup', () => {
  it('mapuje každou buňku na id její klece', () => {
    const cages = [
      trivialCage(1, 5, [
        [0, 0],
        [0, 1],
      ]),
      trivialCage(2, 7, [[1, 0]]),
    ];
    const lookup = buildCageLookup(cages);
    expect(lookup[0][0]).toBe(1);
    expect(lookup[0][1]).toBe(1);
    expect(lookup[1][0]).toBe(2);
    expect(lookup[5][5]).toBeNull();
  });
});

describe('findCageConflicts', () => {
  it('prázdná mřížka nemá konflikty', () => {
    const cages = [
      trivialCage(1, 10, [
        [0, 0],
        [0, 1],
        [0, 2],
      ]),
    ];
    expect(findCageConflicts(createEmptyGrid(), cages)).toHaveLength(0);
  });

  it('duplicita v kleci je konflikt', () => {
    const cages = [
      trivialCage(1, 10, [
        [0, 0],
        [0, 1],
      ]),
    ];
    const grid = createEmptyGrid();
    grid[0][0] = 5;
    grid[0][1] = 5;
    const conflicts = findCageConflicts(grid, cages);
    expect(conflicts).toHaveLength(2);
  });

  it('překročení součtu je konflikt', () => {
    const cages = [
      trivialCage(1, 5, [
        [0, 0],
        [0, 1],
      ]),
    ];
    const grid = createEmptyGrid();
    grid[0][0] = 9;
    grid[0][1] = 1;
    expect(findCageConflicts(grid, cages).length).toBeGreaterThan(0);
  });

  it('neshoda součtu u dokončené klece je konflikt', () => {
    const cages = [
      trivialCage(1, 7, [
        [0, 0],
        [0, 1],
      ]),
    ];
    const grid = createEmptyGrid();
    grid[0][0] = 1;
    grid[0][1] = 2;
    expect(findCageConflicts(grid, cages).length).toBeGreaterThan(0);
  });

  it('dokončená klec se správným součtem není konflikt', () => {
    const cages = [
      trivialCage(1, 3, [
        [0, 0],
        [0, 1],
      ]),
    ];
    const grid = createEmptyGrid();
    grid[0][0] = 1;
    grid[0][1] = 2;
    expect(findCageConflicts(grid, cages)).toHaveLength(0);
  });
});

describe('isValidKillerPlacement', () => {
  it('povolí hodnotu, která splňuje cage constraint', () => {
    const cages = [
      trivialCage(1, 9, [
        [0, 0],
        [0, 1],
        [0, 2],
      ]),
    ];
    const lookup = buildCageLookup(cages);
    const grid = createEmptyGrid();
    grid[0][0] = 2;
    grid[0][1] = 3;
    expect(isValidKillerPlacement(grid, cages, lookup, 0, 2, 4)).toBe(true);
  });

  it('zamítne duplicitu v kleci', () => {
    const cages = [
      trivialCage(1, 10, [
        [0, 0],
        [0, 1],
      ]),
    ];
    const lookup = buildCageLookup(cages);
    const grid = createEmptyGrid();
    grid[0][0] = 4;
    expect(isValidKillerPlacement(grid, cages, lookup, 0, 1, 4)).toBe(false);
  });

  it('zamítne poslední hodnotu, která neodpovídá součtu', () => {
    const cages = [
      trivialCage(1, 9, [
        [0, 0],
        [0, 1],
      ]),
    ];
    const lookup = buildCageLookup(cages);
    const grid = createEmptyGrid();
    grid[0][0] = 2;
    expect(isValidKillerPlacement(grid, cages, lookup, 0, 1, 3)).toBe(false);
    expect(isValidKillerPlacement(grid, cages, lookup, 0, 1, 7)).toBe(true);
  });

  it('buňka mimo klec prochází vždy', () => {
    const cages = [trivialCage(1, 5, [[0, 0]])];
    const lookup = buildCageLookup(cages);
    const grid = createEmptyGrid();
    expect(isValidKillerPlacement(grid, cages, lookup, 5, 5, 9)).toBe(true);
  });
});
