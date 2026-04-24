/**
 * Zustand store pro stav hry — board, výběr, poznámky, čas, chyby, undo, hint.
 *
 * Design:
 *   - Status: menu → playing → paused → completed/failed
 *   - returnToMenu zachová rozehranou hru (status = 'menu', board zůstává).
 *     Continue action ji probudí zpět do 'paused'.
 *   - Historie: každá uživatelská akce snapshotne měněné buňky; undo je vrací zpět
 *   - Persist do localStorage: Set<number> v notes serializujeme jako Array<number>
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Board, Cell, Difficulty, GameMode, Grid } from '@/types/game';
import { BLOCK_SIZE, BOARD_SIZE, EMPTY_CELL } from '@/game/constants';
import {
  boardFromPuzzle,
  cloneBoardShallow,
  cloneCell,
  isBoardFilled,
} from '@/game/board';
import { boardToGrid } from '@/game/board';
import { generatePuzzle } from '@/game/generator';
import { triggerHaptic } from '@/game/haptics';
import { findConflicts } from '@/game/validator';
import { useSettingsStore } from './settingsStore';
import { useStatsStore, type GameOutcome } from './statsStore';

export type GameStatus =
  | 'menu'
  | 'playing'
  | 'paused'
  | 'completed'
  | 'failed';

export interface Position {
  row: number;
  col: number;
}

/** Penalizace v ms za každý použitý hint. */
export const HINT_TIME_PENALTY_MS = 30_000;

interface HistoryEntry {
  cells: Array<{ row: number; col: number; cell: Cell }>;
}

interface GameStoreState {
  status: GameStatus;
  difficulty: Difficulty;
  mode: GameMode;
  board: Board | null;
  solution: Grid | null;
  selected: Position | null;
  noteMode: boolean;
  elapsedMs: number;
  mistakes: number;
  hintsUsed: number;
  history: HistoryEntry[];
}

interface GameStoreActions {
  startNewGame: (difficulty: Difficulty, mode?: GameMode) => void;
  returnToMenu: () => void;
  continueGame: () => void;
  abandonGame: () => void;
  selectCell: (row: number, col: number) => void;
  moveSelection: (dRow: number, dCol: number) => void;
  setDigit: (value: number) => void;
  toggleNote: (value: number) => void;
  handleInput: (value: number) => void;
  toggleNoteMode: () => void;
  erase: () => void;
  undo: () => void;
  useHint: () => void;
  pause: () => void;
  resume: () => void;
  tick: (deltaMs: number) => void;
}

export type GameStore = GameStoreState & GameStoreActions;

const INITIAL_STATE: GameStoreState = {
  status: 'menu',
  difficulty: 'easy',
  mode: 'classic',
  board: null,
  solution: null,
  selected: null,
  noteMode: false,
  elapsedMs: 0,
  mistakes: 0,
  hintsUsed: 0,
  history: [],
};

/** Všechny peer pozice (stejný řádek, sloupec nebo blok), bez samotné buňky. */
function getPeers(row: number, col: number): Position[] {
  const peers: Position[] = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    if (i !== col) peers.push({ row, col: i });
    if (i !== row) peers.push({ row: i, col });
  }
  const blockRow = Math.floor(row / BLOCK_SIZE) * BLOCK_SIZE;
  const blockCol = Math.floor(col / BLOCK_SIZE) * BLOCK_SIZE;
  for (let r = blockRow; r < blockRow + BLOCK_SIZE; r++) {
    for (let c = blockCol; c < blockCol + BLOCK_SIZE; c++) {
      if (r === row || c === col) continue;
      peers.push({ row: r, col: c });
    }
  }
  return peers;
}

/**
 * Zaznamená dokončenou/prohranou hru do statistik. Čte data přímo z aktuálního
 * stavu store'u po transici, takže musí být volána až po set() nové state.
 */
function recordOutcome(state: GameStoreState, outcome: GameOutcome): void {
  useStatsStore.getState().recordGame({
    finishedAt: new Date().toISOString(),
    difficulty: state.difficulty,
    mode: state.mode,
    outcome,
    timeMs: state.elapsedMs,
    mistakes: state.mistakes,
    hintsUsed: state.hintsUsed,
  });
}

/** Najde první prázdnou buňku na desce — pro hint. Vrací null pokud žádná není. */
function findFirstEmpty(board: Board): Position | null {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c].value === EMPTY_CELL) return { row: r, col: c };
    }
  }
  return null;
}

/** Serializovatelná podoba buňky pro persist (notes jako pole čísel). */
interface SerializedCell {
  value: number;
  given: boolean;
  notes: number[];
}
interface SerializedHistoryEntry {
  cells: Array<{ row: number; col: number; cell: SerializedCell }>;
}

function serializeBoard(board: Board): SerializedCell[][] {
  return board.map((row) =>
    row.map((cell) => ({
      value: cell.value,
      given: cell.given,
      notes: Array.from(cell.notes),
    })),
  );
}

function deserializeBoard(board: SerializedCell[][]): Board {
  return board.map((row) =>
    row.map((cell) => ({
      value: cell.value as Cell['value'],
      given: cell.given,
      notes: new Set<number>(cell.notes),
    })),
  );
}

function serializeHistory(history: HistoryEntry[]): SerializedHistoryEntry[] {
  return history.map((entry) => ({
    cells: entry.cells.map((c) => ({
      row: c.row,
      col: c.col,
      cell: {
        value: c.cell.value,
        given: c.cell.given,
        notes: Array.from(c.cell.notes),
      },
    })),
  }));
}

function deserializeHistory(
  history: SerializedHistoryEntry[],
): HistoryEntry[] {
  return history.map((entry) => ({
    cells: entry.cells.map((c) => ({
      row: c.row,
      col: c.col,
      cell: {
        value: c.cell.value as Cell['value'],
        given: c.cell.given,
        notes: new Set<number>(c.cell.notes),
      },
    })),
  }));
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      startNewGame: (difficulty, mode = 'classic') => {
        const { puzzle, solution } = generatePuzzle(difficulty);
        set({
          status: 'playing',
          difficulty,
          mode,
          board: boardFromPuzzle(puzzle),
          solution,
          selected: null,
          noteMode: false,
          elapsedMs: 0,
          mistakes: 0,
          hintsUsed: 0,
          history: [],
        });
      },

      returnToMenu: () => {
        const { status } = get();
        // Z final stavů (completed/failed) se vracíme s čistým storem —
        // Continue nemá smysl, hra už je rozhodnutá.
        if (status === 'completed' || status === 'failed') {
          set({ ...INITIAL_STATE });
        } else {
          set({ status: 'menu' });
        }
      },

      continueGame: () => {
        const { board } = get();
        if (!board) return;
        set({ status: 'paused' });
      },

      abandonGame: () => {
        set({ ...INITIAL_STATE });
      },

      selectCell: (row, col) => {
        if (get().status !== 'playing') return;
        set({ selected: { row, col } });
      },

      moveSelection: (dRow, dCol) => {
        const { selected, status } = get();
        if (status !== 'playing') return;
        const current = selected ?? { row: 0, col: 0 };
        const row = Math.max(0, Math.min(BOARD_SIZE - 1, current.row + dRow));
        const col = Math.max(0, Math.min(BOARD_SIZE - 1, current.col + dCol));
        set({ selected: { row, col } });
      },

      setDigit: (value) => {
        const { board, selected, solution, status, history } = get();
        if (status !== 'playing' || !board || !solution || !selected) return;
        if (value < 1 || value > 9) return;

        const { row, col } = selected;
        const target = board[row][col];
        if (target.given) return;
        if (target.value === value) return;

        const autoRemoveNotes = useSettingsStore.getState().autoRemoveNotes;
        const maxMistakes = useSettingsStore.getState().maxMistakes;

        const changes: HistoryEntry['cells'] = [];
        const newBoard = cloneBoardShallow(board);
        changes.push({ row, col, cell: cloneCell(target) });
        newBoard[row][col] = {
          value: value as Cell['value'],
          given: false,
          notes: new Set<number>(),
        };

        if (autoRemoveNotes) {
          for (const peer of getPeers(row, col)) {
            const pCell = newBoard[peer.row][peer.col];
            if (pCell.value === EMPTY_CELL && pCell.notes.has(value)) {
              changes.push({
                row: peer.row,
                col: peer.col,
                cell: cloneCell(pCell),
              });
              const nextNotes = new Set(pCell.notes);
              nextNotes.delete(value);
              newBoard[peer.row][peer.col] = { ...pCell, notes: nextNotes };
            }
          }
        }

        const isMistake = solution[row][col] !== value;
        const nextMistakes = isMistake
          ? get().mistakes + 1
          : get().mistakes;

        let nextStatus: GameStatus = 'playing';
        if (maxMistakes > 0 && nextMistakes >= maxMistakes) {
          nextStatus = 'failed';
        } else if (
          !isMistake &&
          isBoardFilled(newBoard) &&
          findConflicts(boardToGrid(newBoard)).length === 0
        ) {
          nextStatus = 'completed';
        }

        set({
          board: newBoard,
          history: [...history, { cells: changes }],
          mistakes: nextMistakes,
          status: nextStatus,
        });

        if (nextStatus === 'completed') {
          triggerHaptic('success');
          recordOutcome(get(), 'completed');
        } else if (nextStatus === 'failed') {
          triggerHaptic('fail');
          recordOutcome(get(), 'failed');
        } else if (isMistake) {
          triggerHaptic('error');
        }
      },

      toggleNote: (value) => {
        const { board, selected, status, history } = get();
        if (status !== 'playing' || !board || !selected) return;
        if (value < 1 || value > 9) return;

        const { row, col } = selected;
        const target = board[row][col];
        if (target.given || target.value !== EMPTY_CELL) return;

        const newNotes = new Set(target.notes);
        if (newNotes.has(value)) newNotes.delete(value);
        else newNotes.add(value);

        const newBoard = cloneBoardShallow(board);
        newBoard[row][col] = { ...target, notes: newNotes };

        set({
          board: newBoard,
          history: [
            ...history,
            { cells: [{ row, col, cell: cloneCell(target) }] },
          ],
        });
      },

      handleInput: (value) => {
        const { noteMode, board, selected } = get();
        if (!board || !selected) return;
        const target = board[selected.row][selected.col];
        if (noteMode && target.value === EMPTY_CELL) {
          get().toggleNote(value);
        } else {
          get().setDigit(value);
        }
      },

      toggleNoteMode: () => {
        set((state) => ({ noteMode: !state.noteMode }));
      },

      erase: () => {
        const { board, selected, status, history } = get();
        if (status !== 'playing' || !board || !selected) return;
        const { row, col } = selected;
        const target = board[row][col];
        if (target.given) return;
        if (target.value === EMPTY_CELL && target.notes.size === 0) return;

        const newBoard = cloneBoardShallow(board);
        newBoard[row][col] = {
          value: EMPTY_CELL,
          given: false,
          notes: new Set<number>(),
        };

        set({
          board: newBoard,
          history: [
            ...history,
            { cells: [{ row, col, cell: cloneCell(target) }] },
          ],
        });
      },

      undo: () => {
        const { board, history, status } = get();
        if (status !== 'playing') return;
        if (!board || history.length === 0) return;

        const lastEntry = history[history.length - 1];
        const newBoard = cloneBoardShallow(board);
        for (const change of lastEntry.cells) {
          newBoard[change.row][change.col] = cloneCell(change.cell);
        }

        set({
          board: newBoard,
          history: history.slice(0, -1),
        });
      },

      useHint: () => {
        const { board, solution, selected, status, history, hintsUsed } =
          get();
        if (status !== 'playing' || !board || !solution) return;

        const target =
          selected && board[selected.row][selected.col].value === EMPTY_CELL
            ? selected
            : findFirstEmpty(board);
        if (!target) return;

        const { row, col } = target;
        const correctValue = solution[row][col];
        if (correctValue === EMPTY_CELL) return;

        const previous = board[row][col];
        const newBoard = cloneBoardShallow(board);
        newBoard[row][col] = {
          value: correctValue as Cell['value'],
          given: false,
          notes: new Set<number>(),
        };

        const completed =
          isBoardFilled(newBoard) &&
          findConflicts(boardToGrid(newBoard)).length === 0;

        set({
          board: newBoard,
          hintsUsed: hintsUsed + 1,
          elapsedMs: get().elapsedMs + HINT_TIME_PENALTY_MS,
          history: [
            ...history,
            { cells: [{ row, col, cell: cloneCell(previous) }] },
          ],
          status: completed ? 'completed' : 'playing',
          selected: { row, col },
        });

        if (completed) {
          triggerHaptic('success');
          recordOutcome(get(), 'completed');
        }
      },

      pause: () => {
        if (get().status === 'playing') set({ status: 'paused' });
      },

      resume: () => {
        if (get().status === 'paused') set({ status: 'playing' });
      },

      tick: (deltaMs) => {
        if (get().status !== 'playing') return;
        set((state) => ({ elapsedMs: state.elapsedMs + deltaMs }));
      },
    }),
    {
      name: 'sudoku.game',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({
        status: state.status,
        difficulty: state.difficulty,
        mode: state.mode,
        board: state.board ? serializeBoard(state.board) : null,
        solution: state.solution,
        elapsedMs: state.elapsedMs,
        mistakes: state.mistakes,
        hintsUsed: state.hintsUsed,
        history: serializeHistory(state.history),
      }),
      merge: (persistedState, currentState) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return currentState;
        }
        const p = persistedState as Partial<{
          status: GameStatus;
          difficulty: Difficulty;
          mode: GameMode;
          board: SerializedCell[][] | null;
          solution: Grid | null;
          elapsedMs: number;
          mistakes: number;
          hintsUsed: number;
          history: SerializedHistoryEntry[];
        }>;

        // Final stavy (completed/failed) z předchozí session po refresh zahodíme —
        // hráč už je viděl a znovu ho konfrontovat s overlay by bylo matoucí.
        if (p.status === 'completed' || p.status === 'failed') {
          return { ...currentState };
        }

        return {
          ...currentState,
          status: 'menu',
          difficulty: p.difficulty ?? currentState.difficulty,
          mode: p.mode ?? currentState.mode,
          board: p.board ? deserializeBoard(p.board) : null,
          solution: p.solution ?? null,
          elapsedMs: p.elapsedMs ?? 0,
          mistakes: p.mistakes ?? 0,
          hintsUsed: p.hintsUsed ?? 0,
          history: p.history ? deserializeHistory(p.history) : [],
          selected: null,
          noteMode: false,
        };
      },
    },
  ),
);
