/**
 * Převod mezi čistou numerickou Grid a bohatší Board (Cell[][]) pro UI vrstvu.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import type { Board, Cell, CellValue, Grid } from '@/types/game';
import { BOARD_SIZE, EMPTY_CELL } from './constants';

/** Vytvoří UI Board ze zadání — neprázdné buňky jsou označené jako given. */
export function boardFromPuzzle(puzzle: Grid): Board {
  return puzzle.map((row) =>
    row.map((value) => ({
      value: value as CellValue,
      given: value !== EMPTY_CELL,
      notes: new Set<number>(),
    })),
  );
}

/** Extrahuje numerickou Grid z Board (zachová hodnoty, ignoruje notes a given). */
export function boardToGrid(board: Board): Grid {
  return board.map((row) => row.map((cell) => cell.value));
}

/** Shallow-clone Board s novými referencemi pro řádky. Buňky samy zůstávají stejné. */
export function cloneBoardShallow(board: Board): Board {
  return board.map((row) => row.slice());
}

/** Hluboká kopie jedné buňky včetně Set<number> pro notes. */
export function cloneCell(cell: Cell): Cell {
  return {
    value: cell.value,
    given: cell.given,
    notes: new Set(cell.notes),
  };
}

/** True pokud jsou všechny buňky kompletně vyplněné (bez 0). */
export function isBoardFilled(board: Board): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c].value === EMPTY_CELL) return false;
    }
  }
  return true;
}
