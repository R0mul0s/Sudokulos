/**
 * Testy utilit pro manipulaci s Grid.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { describe, expect, it } from 'vitest';
import {
  cloneGrid,
  countFilled,
  createEmptyGrid,
  formatGrid,
  gridsEqual,
  parseGrid,
} from './grid';

describe('createEmptyGrid', () => {
  it('vytvoří 9x9 mřížku samých nul', () => {
    const grid = createEmptyGrid();
    expect(grid).toHaveLength(9);
    for (const row of grid) {
      expect(row).toHaveLength(9);
      for (const v of row) expect(v).toBe(0);
    }
  });
});

describe('cloneGrid', () => {
  it('vytvoří nezávislou kopii', () => {
    const original = createEmptyGrid();
    original[0][0] = 5;
    const copy = cloneGrid(original);
    copy[0][0] = 9;
    expect(original[0][0]).toBe(5);
    expect(copy[0][0]).toBe(9);
  });
});

describe('parseGrid / formatGrid', () => {
  it('parsuje 81 znaků na mřížku', () => {
    const input = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
    const grid = parseGrid(input);
    expect(grid[0][0]).toBe(5);
    expect(grid[0][1]).toBe(3);
    expect(grid[0][2]).toBe(0);
    expect(grid[8][8]).toBe(9);
  });

  it('ignoruje bílé znaky při parse', () => {
    const input = `
      530 070 000
      600 195 000
      098 000 060
      800 060 003
      400 803 001
      700 020 006
      060 000 280
      000 419 005
      000 080 079
    `;
    const grid = parseGrid(input);
    expect(grid[0][0]).toBe(5);
    expect(grid[8][8]).toBe(9);
  });

  it('round-trip přes tečkovou notaci', () => {
    const input = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
    const grid = parseGrid(input);
    const formatted = formatGrid(grid);
    expect(formatted).toContain('53..7....');
    const reparsed = parseGrid(formatted);
    expect(gridsEqual(grid, reparsed)).toBe(true);
  });

  it('hodí chybu pro nesprávnou délku', () => {
    expect(() => parseGrid('123')).toThrow();
  });
});

describe('countFilled', () => {
  it('počítá neprázdné buňky', () => {
    expect(countFilled(createEmptyGrid())).toBe(0);
    const grid = parseGrid(
      '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
    );
    expect(countFilled(grid)).toBe(30);
  });
});
