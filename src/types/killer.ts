/**
 * Killer sudoku typy — klece (cages) s cílovým součtem.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import type { Grid } from './game';

/** Pozice buňky v mřížce. */
export interface CellPosition {
  row: number;
  col: number;
}

/**
 * Klec v killer sudoku — množina buněk, jejichž hodnoty musí dát
 * zadaný součet a být navzájem unikátní.
 */
export interface Cage {
  /** Unikátní identifikátor klece (pro klíčování v UI). */
  id: number;
  /** Cílový součet (suma hodnot v solution). */
  sum: number;
  /** Buňky patřící do klece. */
  cells: CellPosition[];
}

export interface KillerPuzzle {
  /** Klece pokrývající celou 9×9 mřížku (každá buňka je právě v jedné). */
  cages: Cage[];
  /** Plné řešení. */
  solution: Grid;
}
