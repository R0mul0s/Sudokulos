/**
 * Testy výpočtu kandidátů pro buňky.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { describe, expect, it } from 'vitest';
import { createEmptyGrid, parseGrid } from './grid';
import { computeAutoNotes, getPossibleValues } from './notes';

describe('getPossibleValues', () => {
  it('pro prázdnou mřížku vrátí 1-9', () => {
    const grid = createEmptyGrid();
    expect(getPossibleValues(grid, 4, 4)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('pro neprázdnou buňku vrátí prázdné pole', () => {
    const grid = createEmptyGrid();
    grid[0][0] = 5;
    expect(getPossibleValues(grid, 0, 0)).toEqual([]);
  });

  it('vyloučí hodnoty už použité v řádku, sloupci a bloku', () => {
    const grid = createEmptyGrid();
    grid[0][1] = 1;
    grid[0][2] = 2;
    grid[1][0] = 3;
    grid[2][0] = 4;
    grid[1][1] = 5;
    const candidates = getPossibleValues(grid, 0, 0);
    expect(candidates).toEqual([6, 7, 8, 9]);
  });

  it('na reálném zadání vrací konzistentní kandidáty', () => {
    const grid = parseGrid(
      '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
    );
    const candidates = getPossibleValues(grid, 0, 2);
    expect(candidates).toContain(4);
    expect(candidates).not.toContain(5);
    expect(candidates).not.toContain(3);
  });
});

describe('computeAutoNotes', () => {
  it('vrátí 9x9 strukturu', () => {
    const notes = computeAutoNotes(createEmptyGrid());
    expect(notes).toHaveLength(9);
    for (const row of notes) expect(row).toHaveLength(9);
  });

  it('pro každou buňku odpovídá getPossibleValues', () => {
    const grid = parseGrid(
      '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
    );
    const notes = computeAutoNotes(grid);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        expect(notes[r][c]).toEqual(getPossibleValues(grid, r, c));
      }
    }
  });
});
