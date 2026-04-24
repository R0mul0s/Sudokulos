/**
 * Klávesnice 1-9 pro vložení hodnoty nebo poznámky.
 * V poznámkovém módu se vkládají kandidáti, jinak číslice.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { useMemo } from 'react';
import { BOARD_SIZE } from '@/game/constants';
import { useGameStore } from '@/store/gameStore';

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

/** Spočítá kolikrát je hodnota na desce — pro vizuální indikaci "kolik mi ještě zbývá". */
function useDigitCounts(): Record<number, number> {
  const board = useGameStore((s) => s.board);
  return useMemo(() => {
    const counts: Record<number, number> = {};
    for (const d of DIGITS) counts[d] = 0;
    if (!board) return counts;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const v = board[r][c].value;
        if (v !== 0) counts[v]++;
      }
    }
    return counts;
  }, [board]);
}

export function NumberPad() {
  const handleInput = useGameStore((s) => s.handleInput);
  const noteMode = useGameStore((s) => s.noteMode);
  const counts = useDigitCounts();

  return (
    <div
      className="grid w-full grid-cols-9 gap-1 sm:gap-2"
      role="group"
      aria-label="Číselná klávesnice"
    >
      {DIGITS.map((d) => {
        const isUsedUp = counts[d] >= BOARD_SIZE;
        return (
          <button
            key={d}
            type="button"
            onClick={() => handleInput(d)}
            disabled={isUsedUp}
            className={[
              'flex aspect-square items-center justify-center rounded-xl',
              'text-xl font-semibold shadow-sm transition',
              'active:scale-95',
              isUsedUp
                ? 'bg-slate-100 text-slate-400'
                : noteMode
                  ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                  : 'bg-white text-slate-900 hover:bg-slate-50',
            ].join(' ')}
            aria-label={`Vložit ${d}`}
          >
            {d}
          </button>
        );
      })}
    </div>
  );
}
