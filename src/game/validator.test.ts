/**
 * Testy validatoru — řádek, sloupec, blok, kompletnost.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { describe, expect, it } from 'vitest';
import { createEmptyGrid, parseGrid } from './grid';
import {
  findConflicts,
  isGridComplete,
  isGridSolved,
  isGridValid,
  isValidPlacement,
} from './validator';

const VALID_SOLVED =
  '534678912672195348198342567859761423426853791713924856961537284287419635345286179';

const VALID_PARTIAL =
  '530070000600195000098000060800060003400803001700020006060000280000419005000080079';

describe('isValidPlacement', () => {
  it('povolí číslo do prázdné buňky bez konfliktu', () => {
    const grid = createEmptyGrid();
    expect(isValidPlacement(grid, 0, 0, 5)).toBe(true);
  });

  it('zamítne duplicitu v řádku', () => {
    const grid = createEmptyGrid();
    grid[0][3] = 7;
    expect(isValidPlacement(grid, 0, 5, 7)).toBe(false);
  });

  it('zamítne duplicitu ve sloupci', () => {
    const grid = createEmptyGrid();
    grid[2][4] = 3;
    expect(isValidPlacement(grid, 7, 4, 3)).toBe(false);
  });

  it('zamítne duplicitu v 3x3 bloku', () => {
    const grid = createEmptyGrid();
    grid[0][0] = 9;
    expect(isValidPlacement(grid, 2, 2, 9)).toBe(false);
  });

  it('povolí znovu-zapsání stejné hodnoty do stejné buňky', () => {
    const grid = createEmptyGrid();
    grid[4][4] = 6;
    expect(isValidPlacement(grid, 4, 4, 6)).toBe(true);
  });

  it('zamítne hodnoty mimo 1-9', () => {
    const grid = createEmptyGrid();
    expect(isValidPlacement(grid, 0, 0, 0)).toBe(false);
    expect(isValidPlacement(grid, 0, 0, 10)).toBe(false);
    expect(isValidPlacement(grid, 0, 0, -1)).toBe(false);
  });
});

describe('findConflicts', () => {
  it('prázdná mřížka nemá konflikty', () => {
    expect(findConflicts(createEmptyGrid())).toHaveLength(0);
  });

  it('vyřešená mřížka nemá konflikty', () => {
    expect(findConflicts(parseGrid(VALID_SOLVED))).toHaveLength(0);
  });

  it('najde konflikt v řádku', () => {
    const grid = createEmptyGrid();
    grid[0][0] = 5;
    grid[0][5] = 5;
    const conflicts = findConflicts(grid);
    expect(conflicts).toHaveLength(2);
  });

  it('najde konflikt v bloku', () => {
    const grid = createEmptyGrid();
    grid[0][0] = 3;
    grid[2][2] = 3;
    const conflicts = findConflicts(grid);
    expect(conflicts).toHaveLength(2);
  });

  it('stejnou buňku nereportuje dvakrát, i když je v konfliktu v řádku i bloku', () => {
    const grid = createEmptyGrid();
    grid[0][0] = 4;
    grid[0][1] = 4;
    grid[1][0] = 4;
    const conflicts = findConflicts(grid);
    expect(conflicts).toHaveLength(3);
  });
});

describe('isGridComplete / isGridValid / isGridSolved', () => {
  it('prázdná mřížka: nekompletní, validní, nevyřešená', () => {
    const grid = createEmptyGrid();
    expect(isGridComplete(grid)).toBe(false);
    expect(isGridValid(grid)).toBe(true);
    expect(isGridSolved(grid)).toBe(false);
  });

  it('částečně vyplněná bez konfliktů: nekompletní, validní, nevyřešená', () => {
    const grid = parseGrid(VALID_PARTIAL);
    expect(isGridComplete(grid)).toBe(false);
    expect(isGridValid(grid)).toBe(true);
    expect(isGridSolved(grid)).toBe(false);
  });

  it('kompletní a bez konfliktů: vyřešená', () => {
    const grid = parseGrid(VALID_SOLVED);
    expect(isGridComplete(grid)).toBe(true);
    expect(isGridValid(grid)).toBe(true);
    expect(isGridSolved(grid)).toBe(true);
  });

  it('kompletní s konfliktem: není vyřešená', () => {
    const grid = parseGrid(VALID_SOLVED);
    grid[0][0] = grid[0][1];
    expect(isGridComplete(grid)).toBe(true);
    expect(isGridValid(grid)).toBe(false);
    expect(isGridSolved(grid)).toBe(false);
  });
});
