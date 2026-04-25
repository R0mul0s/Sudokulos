/**
 * Jedna buňka sudoku desky. Zobrazuje hodnotu nebo poznámky a reaguje na klik.
 * O logiku stavu (selection, highlight) se stará rodič (Board). RPG overlay
 * (lucky cell hvězdička, peek vodoznak) jsou volitelné props.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { memo } from 'react';
import type { Cell as CellType } from '@/types/game';
import { BLOCK_SIZE, BOARD_SIZE } from '@/game/constants';

export interface CellProps {
  row: number;
  col: number;
  cell: CellType;
  isSelected: boolean;
  isPeer: boolean;
  isSameValue: boolean;
  isError: boolean;
  /** True pokud buňka je v RPG runu označená jako lucky a ještě není vyřešená. */
  isLucky?: boolean;
  /** Vodoznak hodnoty z Peek power-upu (zobrazí se transparentně, neovlivňuje stav). */
  peekValue?: number | null;
  onClick: (row: number, col: number) => void;
}

const NOTE_GRID = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

function cellBackground(
  isSelected: boolean,
  isPeer: boolean,
  isSameValue: boolean,
): string {
  if (isSelected) return 'bg-cell-selected';
  if (isSameValue) return 'bg-cell-highlight';
  if (isPeer) return 'bg-cell-peer';
  return 'bg-surface';
}

function cellTextColor(
  given: boolean,
  isError: boolean,
  hasValue: boolean,
): string {
  if (!hasValue) return 'text-transparent';
  if (isError) return 'text-cell-error';
  if (given) return 'text-cell-given';
  return 'text-cell-user';
}

function borderClasses(row: number, col: number): string {
  const classes: string[] = ['border-border'];
  if (row % BLOCK_SIZE === 0)
    classes.push('border-t-2 border-t-slate-900 dark:border-t-slate-100');
  if (col % BLOCK_SIZE === 0)
    classes.push('border-l-2 border-l-slate-900 dark:border-l-slate-100');
  if (row === BOARD_SIZE - 1)
    classes.push('border-b-2 border-b-slate-900 dark:border-b-slate-100');
  if (col === BOARD_SIZE - 1)
    classes.push('border-r-2 border-r-slate-900 dark:border-r-slate-100');
  return classes.join(' ');
}

export const Cell = memo(function Cell({
  row,
  col,
  cell,
  isSelected,
  isPeer,
  isSameValue,
  isError,
  isLucky = false,
  peekValue = null,
  onClick,
}: CellProps) {
  const hasValue = cell.value !== 0;
  const showPeek = !hasValue && peekValue !== null;

  return (
    <button
      type="button"
      onClick={() => onClick(row, col)}
      className={[
        'relative flex aspect-square items-center justify-center border',
        'text-2xl font-semibold transition-colors sm:text-3xl',
        'focus:outline-none',
        cellBackground(isSelected, isPeer, isSameValue),
        cellTextColor(cell.given, isError, hasValue),
        borderClasses(row, col),
      ].join(' ')}
      aria-label={`Buňka ${row + 1}, ${col + 1}`}
      aria-selected={isSelected}
    >
      {hasValue ? (
        cell.value
      ) : showPeek ? (
        <span className="text-2xl font-semibold text-amber-500/70 sm:text-3xl">
          {peekValue}
        </span>
      ) : cell.notes.size > 0 ? (
        <div className="grid h-full w-full grid-cols-3 grid-rows-3 p-0.5 text-[9px] leading-none text-text-muted sm:text-[11px]">
          {NOTE_GRID.map((n) => (
            <span key={n} className="flex items-center justify-center">
              {cell.notes.has(n) ? n : ''}
            </span>
          ))}
        </div>
      ) : null}
      {isLucky && !hasValue && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-0.5 top-0 text-[10px] leading-none text-amber-500"
        >
          ⭐
        </span>
      )}
    </button>
  );
});
