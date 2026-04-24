/**
 * SVG overlay nad sudoku deskou, který kreslí obrysy klecí (přerušovanou čarou)
 * a štítek se součtem v levém horním rohu každé klece.
 *
 * Strategie: pro každou buňku v kleci zkontroluj její 4 sousedy a nakresli
 * vnitřní hraniční čáru pouze tam, kde soused není ve stejné kleci.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { useMemo } from 'react';
import type { Cage } from '@/types/killer';
import { BOARD_SIZE } from '@/game/constants';

export interface CageOverlayProps {
  cages: readonly Cage[];
}

/** SVG viewBox: celá deska 0..100, jedna buňka = CELL units. */
const CELL = 100 / BOARD_SIZE;
/** Jak daleko od okraje buňky kreslit cage čáru (v units). */
const INSET = 0.8;
/** Label offset od levého horního rohu buňky (v units). */
const LABEL_X = 1.2;
const LABEL_Y = 2.6;

interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Pro každou klec vrátí vnitřní hranové segmenty (přerušovaná čára obrysu).
 */
function buildSegments(cage: Cage, inCage: Set<string>): Segment[] {
  const segments: Segment[] = [];
  for (const { row, col } of cage.cells) {
    const x = col * CELL;
    const y = row * CELL;

    const hasTop = inCage.has(`${row - 1},${col}`);
    const hasBottom = inCage.has(`${row + 1},${col}`);
    const hasLeft = inCage.has(`${row},${col - 1}`);
    const hasRight = inCage.has(`${row},${col + 1}`);

    if (!hasTop) {
      segments.push({
        x1: x + INSET,
        y1: y + INSET,
        x2: x + CELL - INSET,
        y2: y + INSET,
      });
    }
    if (!hasBottom) {
      segments.push({
        x1: x + INSET,
        y1: y + CELL - INSET,
        x2: x + CELL - INSET,
        y2: y + CELL - INSET,
      });
    }
    if (!hasLeft) {
      segments.push({
        x1: x + INSET,
        y1: y + INSET,
        x2: x + INSET,
        y2: y + CELL - INSET,
      });
    }
    if (!hasRight) {
      segments.push({
        x1: x + CELL - INSET,
        y1: y + INSET,
        x2: x + CELL - INSET,
        y2: y + CELL - INSET,
      });
    }
  }
  return segments;
}

/** Vrátí pozici pro label se součtem: horní-levá buňka klece. */
function findLabelCell(cage: Cage): { row: number; col: number } {
  return cage.cells.reduce((best, current) => {
    if (current.row < best.row) return current;
    if (current.row > best.row) return best;
    return current.col < best.col ? current : best;
  });
}

export function CageOverlay({ cages }: CageOverlayProps) {
  const segmentsPerCage = useMemo(() => {
    return cages.map((cage) => {
      const inCage = new Set<string>(
        cage.cells.map((c) => `${c.row},${c.col}`),
      );
      return {
        cage,
        segments: buildSegments(cage, inCage),
        label: findLabelCell(cage),
      };
    });
  }, [cages]);

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      {segmentsPerCage.map(({ cage, segments, label }) => (
        <g key={cage.id}>
          {segments.map((seg, idx) => (
            <line
              key={idx}
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              className="stroke-slate-500 dark:stroke-slate-400"
              strokeWidth={0.35}
              strokeDasharray="1 0.6"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <text
            x={label.col * CELL + LABEL_X}
            y={label.row * CELL + LABEL_Y}
            className="fill-slate-700 dark:fill-slate-300"
            fontSize="2.6"
            fontWeight="600"
          >
            {cage.sum}
          </text>
        </g>
      ))}
    </svg>
  );
}
