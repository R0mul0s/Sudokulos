/**
 * Sdílené herní typy — mřížka, buňka, obtížnost, herní módy
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */

export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/**
 * Čistá numerická 9×9 mřížka — 0 znamená prázdnou buňku.
 * Používá ji herní logika (solver, generátor, validator).
 */
export type Grid = number[][];

/** Jedna buňka — hodnota, zda je zadaná na startu, případné poznámky */
export interface Cell {
  value: CellValue;
  given: boolean;
  notes: Set<number>;
}

/** 9×9 mřížka pro UI vrstvu (bohatší než Grid — ví o poznámkách a given buňkách) */
export type Board = Cell[][];

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

/** Rozšiřitelný seznam herních módů */
export type GameMode = 'classic' | 'killer';

export interface GameState {
  board: Board;
  solution: number[][];
  difficulty: Difficulty;
  mode: GameMode;
  startedAt: number;
  elapsedMs: number;
  mistakes: number;
  isPaused: boolean;
  isCompleted: boolean;
}
