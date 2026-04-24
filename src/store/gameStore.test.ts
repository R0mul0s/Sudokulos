/**
 * Testy herního storu — akce, undo, detekce chyb, dokončení, persist, hint.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { beforeEach, describe, expect, it } from 'vitest';
import type { Board, Grid } from '@/types/game';
import { boardFromPuzzle } from '@/game/board';
import { parseGrid } from '@/game/grid';
import { useGameStore } from './gameStore';
import { useSettingsStore } from './settingsStore';

const SOLUTION =
  '534678912672195348198342567859761423426853791713924856961537284287419635345286179';

const EASY_PUZZLE =
  '530070000600195000098000060800060003400803001700020006060000280000419005000080079';

function seedPlayingState(puzzle: string = EASY_PUZZLE): {
  board: Board;
  solution: Grid;
} {
  const puzzleGrid = parseGrid(puzzle);
  const solution = parseGrid(SOLUTION);
  const board = boardFromPuzzle(puzzleGrid);
  useGameStore.setState({
    status: 'playing',
    difficulty: 'easy',
    mode: 'classic',
    board,
    solution,
    selected: null,
    noteMode: false,
    elapsedMs: 0,
    mistakes: 0,
    hintsUsed: 0,
    history: [],
  });
  return { board, solution };
}

describe('gameStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useGameStore.getState().abandonGame();
    useSettingsStore.getState().resetDefaults();
  });

  describe('abandonGame', () => {
    it('resetuje stav na výchozí hodnoty', () => {
      seedPlayingState();
      useGameStore.getState().abandonGame();
      const state = useGameStore.getState();
      expect(state.status).toBe('menu');
      expect(state.board).toBeNull();
      expect(state.mistakes).toBe(0);
    });
  });

  describe('returnToMenu / continueGame', () => {
    it('returnToMenu zachová board, jen změní status', () => {
      seedPlayingState();
      useGameStore.getState().returnToMenu();
      const state = useGameStore.getState();
      expect(state.status).toBe('menu');
      expect(state.board).not.toBeNull();
    });

    it('continueGame přepne zpět na paused', () => {
      seedPlayingState();
      useGameStore.getState().returnToMenu();
      useGameStore.getState().continueGame();
      expect(useGameStore.getState().status).toBe('paused');
    });

    it('continueGame bez boardu nic neudělá', () => {
      useGameStore.getState().continueGame();
      expect(useGameStore.getState().status).toBe('menu');
    });

    it('returnToMenu z failed stavu zahodí board (Continue už nesmí svítit)', () => {
      seedPlayingState();
      useGameStore.setState({ status: 'failed' });
      useGameStore.getState().returnToMenu();
      const state = useGameStore.getState();
      expect(state.status).toBe('menu');
      expect(state.board).toBeNull();
    });

    it('returnToMenu z completed stavu zahodí board', () => {
      seedPlayingState();
      useGameStore.setState({ status: 'completed' });
      useGameStore.getState().returnToMenu();
      expect(useGameStore.getState().board).toBeNull();
    });
  });

  describe('selectCell', () => {
    it('ve stavu playing nastaví selected', () => {
      seedPlayingState();
      useGameStore.getState().selectCell(3, 5);
      expect(useGameStore.getState().selected).toEqual({ row: 3, col: 5 });
    });

    it('mimo stav playing selected neovlivní', () => {
      useGameStore.getState().selectCell(1, 1);
      expect(useGameStore.getState().selected).toBeNull();
    });
  });

  describe('setDigit', () => {
    it('vloží správnou hodnotu bez chyby', () => {
      const { solution } = seedPlayingState();
      useGameStore.getState().selectCell(0, 2);
      useGameStore.getState().setDigit(solution[0][2]);
      const state = useGameStore.getState();
      expect(state.board![0][2].value).toBe(solution[0][2]);
      expect(state.mistakes).toBe(0);
    });

    it('špatná hodnota zvýší počet chyb', () => {
      seedPlayingState();
      useGameStore.getState().selectCell(0, 2);
      useGameStore.getState().setDigit(5);
      expect(useGameStore.getState().mistakes).toBe(1);
    });

    it('při dosažení limitu chyb přejde do failed', () => {
      seedPlayingState();
      useSettingsStore.getState().setMaxMistakes(3);
      const store = useGameStore.getState();
      // 3 špatné vložení do různých prázdných buněk (0,2), (0,3), (0,5) v EASY_PUZZLE
      store.selectCell(0, 2);
      store.setDigit(5);
      store.selectCell(0, 3);
      store.setDigit(5);
      store.selectCell(0, 5);
      store.setDigit(5);
      expect(useGameStore.getState().status).toBe('failed');
    });

    it('bez limitu chyb (maxMistakes=0) se status nezmění', () => {
      seedPlayingState();
      useSettingsStore.getState().setMaxMistakes(0);
      const store = useGameStore.getState();
      // Prázdné buňky v řádku 0 dle EASY_PUZZLE
      for (const col of [2, 3, 5, 6, 7, 8]) {
        store.selectCell(0, col);
        store.setDigit(5);
      }
      expect(useGameStore.getState().status).toBe('playing');
    });

    it('ignoruje given buňku', () => {
      seedPlayingState();
      useGameStore.getState().selectCell(0, 0);
      const before = useGameStore.getState().board![0][0].value;
      useGameStore.getState().setDigit(1);
      expect(useGameStore.getState().board![0][0].value).toBe(before);
    });

    it('vložení hodnoty smaže tu samou poznámku u peerů (autoRemoveNotes=on)', () => {
      seedPlayingState();
      useSettingsStore.getState().setAutoRemoveNotes(true);
      const store = useGameStore.getState();
      store.selectCell(1, 2);
      store.toggleNoteMode();
      store.toggleNote(4);
      store.toggleNoteMode();
      store.selectCell(0, 2);
      store.setDigit(4);
      expect(useGameStore.getState().board![1][2].notes.has(4)).toBe(false);
    });

    it('autoRemoveNotes=off neodstraní poznámky', () => {
      seedPlayingState();
      useSettingsStore.getState().setAutoRemoveNotes(false);
      const store = useGameStore.getState();
      store.selectCell(1, 2);
      store.toggleNoteMode();
      store.toggleNote(4);
      store.toggleNoteMode();
      store.selectCell(0, 2);
      store.setDigit(4);
      expect(useGameStore.getState().board![1][2].notes.has(4)).toBe(true);
    });
  });

  describe('useHint', () => {
    it('doplní prázdnou buňku správnou hodnotou', () => {
      const { solution } = seedPlayingState();
      useGameStore.getState().useHint();
      const board = useGameStore.getState().board!;
      let firstEmpty: { row: number; col: number } | null = null;
      outer: for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (parseGrid(EASY_PUZZLE)[r][c] === 0) {
            firstEmpty = { row: r, col: c };
            break outer;
          }
        }
      }
      expect(firstEmpty).not.toBeNull();
      expect(board[firstEmpty!.row][firstEmpty!.col].value).toBe(
        solution[firstEmpty!.row][firstEmpty!.col],
      );
      expect(useGameStore.getState().hintsUsed).toBe(1);
    });

    it('přidá časovou penalizaci', () => {
      seedPlayingState();
      useGameStore.getState().useHint();
      expect(useGameStore.getState().elapsedMs).toBe(30_000);
    });

    it('preferuje selected pokud je prázdná', () => {
      const { solution } = seedPlayingState();
      useGameStore.getState().selectCell(4, 7);
      useGameStore.getState().useHint();
      expect(useGameStore.getState().board![4][7].value).toBe(solution[4][7]);
    });
  });

  describe('toggleNote / noteMode', () => {
    it('přepne poznámku na prázdné buňce', () => {
      seedPlayingState();
      useGameStore.getState().selectCell(0, 2);
      useGameStore.getState().toggleNote(3);
      expect(useGameStore.getState().board![0][2].notes.has(3)).toBe(true);
      useGameStore.getState().toggleNote(3);
      expect(useGameStore.getState().board![0][2].notes.has(3)).toBe(false);
    });

    it('noteMode přesměruje handleInput na toggleNote', () => {
      seedPlayingState();
      useGameStore.getState().selectCell(0, 2);
      useGameStore.getState().toggleNoteMode();
      useGameStore.getState().handleInput(5);
      const cell = useGameStore.getState().board![0][2];
      expect(cell.value).toBe(0);
      expect(cell.notes.has(5)).toBe(true);
    });
  });

  describe('erase / undo', () => {
    it('erase smaže hodnotu i poznámky', () => {
      seedPlayingState();
      const store = useGameStore.getState();
      store.selectCell(0, 2);
      store.setDigit(4);
      store.erase();
      const cell = useGameStore.getState().board![0][2];
      expect(cell.value).toBe(0);
      expect(cell.notes.size).toBe(0);
    });

    it('undo vrátí poslední změnu', () => {
      seedPlayingState();
      useGameStore.getState().selectCell(0, 2);
      useGameStore.getState().setDigit(4);
      useGameStore.getState().undo();
      expect(useGameStore.getState().board![0][2].value).toBe(0);
      expect(useGameStore.getState().history).toHaveLength(0);
    });
  });

  describe('pause / resume / tick', () => {
    it('pause zastaví tick', () => {
      seedPlayingState();
      useGameStore.getState().tick(100);
      useGameStore.getState().pause();
      useGameStore.getState().tick(500);
      expect(useGameStore.getState().elapsedMs).toBe(100);
    });
  });

  describe('dokončení', () => {
    it('vložení poslední správné hodnoty přepne status na completed', () => {
      const solution = parseGrid(SOLUTION);
      const board = boardFromPuzzle(solution);
      board[0][0] = { value: 0, given: false, notes: new Set() };
      useGameStore.setState({
        status: 'playing',
        difficulty: 'easy',
        mode: 'classic',
        board,
        solution,
        selected: null,
        noteMode: false,
        elapsedMs: 0,
        mistakes: 0,
        hintsUsed: 0,
        history: [],
      });
      useGameStore.getState().selectCell(0, 0);
      useGameStore.getState().setDigit(5);
      expect(useGameStore.getState().status).toBe('completed');
    });
  });

  describe('persist', () => {
    it('uloží stav do localStorage a poznámky přežijí jako pole', () => {
      seedPlayingState();
      useGameStore.getState().selectCell(0, 2);
      useGameStore.getState().toggleNoteMode();
      useGameStore.getState().toggleNote(7);
      const raw = localStorage.getItem('sudoku.game');
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!) as {
        state: { board: Array<Array<{ notes: number[] }>> };
      };
      expect(parsed.state.board[0][2].notes).toContain(7);
    });
  });
});
