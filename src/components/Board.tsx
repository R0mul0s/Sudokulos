/**
 * Hlavní herní deska 9×9. Čte stav ze storu a zařizuje zvýraznění.
 * V killer módu vykresluje nad mřížkou overlay s ohraničením klecí a součty.
 * V RPG runu navíc ukazuje lucky cells, peek vodoznak a (s relic Sharp Eye)
 * rozšiřuje peer highlight o diagonálně sousedící buňky.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { useMemo } from 'react';
import { BLOCK_SIZE, BOARD_SIZE } from '@/game/constants';
import { boardToGrid } from '@/game/board';
import { findConflicts } from '@/game/validator';
import { findCageConflicts } from '@/game/killer/validator';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useRunStore } from '@/store/runStore';
import { Cell } from './Cell';
import { CageOverlay } from './killer/CageOverlay';

function isPeer(
  row: number,
  col: number,
  selRow: number,
  selCol: number,
  includeDiagonals: boolean,
): boolean {
  if (row === selRow && col === selCol) return false;
  if (row === selRow || col === selCol) return true;
  const sameBlockRow =
    Math.floor(row / BLOCK_SIZE) === Math.floor(selRow / BLOCK_SIZE);
  const sameBlockCol =
    Math.floor(col / BLOCK_SIZE) === Math.floor(selCol / BLOCK_SIZE);
  if (sameBlockRow && sameBlockCol) return true;
  if (includeDiagonals) {
    if (Math.abs(row - selRow) === 1 && Math.abs(col - selCol) === 1) {
      return true;
    }
  }
  return false;
}

export function Board() {
  const board = useGameStore((s) => s.board);
  const solution = useGameStore((s) => s.solution);
  const cages = useGameStore((s) => s.cages);
  const mode = useGameStore((s) => s.mode);
  const selected = useGameStore((s) => s.selected);
  const selectCell = useGameStore((s) => s.selectCell);
  const highlightSameDigits = useSettingsStore((s) => s.highlightSameDigits);
  const luckyCells = useRunStore((s) => s.run?.luckyCells ?? []);
  const consumedLucky = useRunStore((s) => s.levelState.consumedLuckyCells);
  const peek = useRunStore((s) => s.levelState.peek);
  const sharpEye = useRunStore((s) =>
    (s.run?.player.relics ?? []).some(
      (r) => r.id === 'sharp_eye' && !r.consumed,
    ),
  );

  const conflictSet = useMemo(() => {
    if (!board) return new Set<string>();
    const grid = boardToGrid(board);
    const classic = findConflicts(grid);
    const all = new Set(classic.map((p) => `${p.row},${p.col}`));
    if (mode === 'killer' && cages) {
      for (const p of findCageConflicts(grid, cages)) {
        all.add(`${p.row},${p.col}`);
      }
    }
    return all;
  }, [board, mode, cages]);

  const luckySet = useMemo(() => {
    const set = new Set(luckyCells);
    for (const consumed of consumedLucky) set.delete(consumed);
    return set;
  }, [luckyCells, consumedLucky]);

  if (!board) return null;

  const selectedValue =
    selected && board[selected.row][selected.col].value !== 0
      ? board[selected.row][selected.col].value
      : null;

  return (
    <div
      className="relative grid aspect-square w-full max-w-[min(100vw-2rem,32rem)] grid-cols-9 grid-rows-9 rounded-md bg-surface shadow-sm dark:shadow-none"
      role="grid"
      aria-label="Sudoku deska"
    >
      {board.flatMap((row, rowIdx) =>
        row.map((cell, colIdx) => {
          const isSelected =
            selected?.row === rowIdx && selected?.col === colIdx;
          const peer =
            selected !== null &&
            isPeer(rowIdx, colIdx, selected.row, selected.col, sharpEye);
          const sameValue =
            highlightSameDigits &&
            selectedValue !== null &&
            !isSelected &&
            cell.value === selectedValue;
          const isError =
            !cell.given &&
            cell.value !== 0 &&
            (conflictSet.has(`${rowIdx},${colIdx}`) ||
              (solution !== null && solution[rowIdx][colIdx] !== cell.value));
          const isLucky = luckySet.has(`${rowIdx},${colIdx}`);
          const peekValue =
            peek && peek.row === rowIdx && peek.col === colIdx
              ? peek.value
              : null;

          return (
            <Cell
              key={`${rowIdx}-${colIdx}`}
              row={rowIdx}
              col={colIdx}
              cell={cell}
              isSelected={isSelected}
              isPeer={peer}
              isSameValue={sameValue}
              isError={isError}
              isLucky={isLucky}
              peekValue={peekValue}
              onClick={selectCell}
            />
          );
        }),
      )}
      {mode === 'killer' && cages && <CageOverlay cages={cages} />}
      <span className="sr-only">{`Deska ${BOARD_SIZE}×${BOARD_SIZE}`}</span>
    </div>
  );
}
