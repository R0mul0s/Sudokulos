/**
 * Hlavní herní deska 9×9. Čte stav ze storu a zařizuje zvýraznění.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { useMemo } from 'react';
import { BLOCK_SIZE, BOARD_SIZE } from '@/game/constants';
import { boardToGrid } from '@/game/board';
import { findConflicts } from '@/game/validator';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Cell } from './Cell';

function isPeer(
  row: number,
  col: number,
  selRow: number,
  selCol: number,
): boolean {
  if (row === selRow && col === selCol) return false;
  if (row === selRow || col === selCol) return true;
  const sameBlockRow =
    Math.floor(row / BLOCK_SIZE) === Math.floor(selRow / BLOCK_SIZE);
  const sameBlockCol =
    Math.floor(col / BLOCK_SIZE) === Math.floor(selCol / BLOCK_SIZE);
  return sameBlockRow && sameBlockCol;
}

export function Board() {
  const board = useGameStore((s) => s.board);
  const solution = useGameStore((s) => s.solution);
  const selected = useGameStore((s) => s.selected);
  const selectCell = useGameStore((s) => s.selectCell);
  const highlightSameDigits = useSettingsStore((s) => s.highlightSameDigits);

  const conflictSet = useMemo(() => {
    if (!board) return new Set<string>();
    const conflicts = findConflicts(boardToGrid(board));
    return new Set(conflicts.map((p) => `${p.row},${p.col}`));
  }, [board]);

  if (!board) return null;

  const selectedValue =
    selected && board[selected.row][selected.col].value !== 0
      ? board[selected.row][selected.col].value
      : null;

  return (
    <div
      className="grid aspect-square w-full max-w-[min(100vw-2rem,32rem)] grid-cols-9 grid-rows-9 rounded-md bg-surface shadow-sm dark:shadow-none"
      role="grid"
      aria-label="Sudoku deska"
    >
      {board.flatMap((row, rowIdx) =>
        row.map((cell, colIdx) => {
          const isSelected =
            selected?.row === rowIdx && selected?.col === colIdx;
          const peer =
            selected !== null &&
            isPeer(rowIdx, colIdx, selected.row, selected.col);
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
              onClick={selectCell}
            />
          );
        }),
      )}
      <span className="sr-only">{`Deska ${BOARD_SIZE}×${BOARD_SIZE}`}</span>
    </div>
  );
}
