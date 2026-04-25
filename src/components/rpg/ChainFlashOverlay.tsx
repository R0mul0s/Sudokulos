/**
 * Krátká SVG flash animace nad nově dokončenou skupinou (řádek/sloupec/blok).
 * Spouští se při chain reaction v RPG runu — visual reward.
 *
 * @author Roman Hlaváček
 * @created 2026-04-25
 */
import type { LastChain } from '@/store/gameStore';
import { BLOCK_SIZE, BOARD_SIZE } from '@/game/constants';

const CELL = 100 / BOARD_SIZE;

interface ChainFlashOverlayProps {
  chain: LastChain;
}

export function ChainFlashOverlay({ chain }: ChainFlashOverlayProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      {chain.rows.map((row) => (
        <rect
          key={`row-${row}`}
          x={0}
          y={row * CELL}
          width={100}
          height={CELL}
          className="animate-chain-flash fill-amber-300 dark:fill-amber-400"
        />
      ))}
      {chain.cols.map((col) => (
        <rect
          key={`col-${col}`}
          x={col * CELL}
          y={0}
          width={CELL}
          height={100}
          className="animate-chain-flash fill-amber-300 dark:fill-amber-400"
        />
      ))}
      {chain.blocks.map((blockIdx) => {
        const blockRow = Math.floor(blockIdx / BLOCK_SIZE) * BLOCK_SIZE;
        const blockCol = (blockIdx % BLOCK_SIZE) * BLOCK_SIZE;
        return (
          <rect
            key={`block-${blockIdx}`}
            x={blockCol * CELL}
            y={blockRow * CELL}
            width={CELL * BLOCK_SIZE}
            height={CELL * BLOCK_SIZE}
            className="animate-chain-flash fill-amber-300 dark:fill-amber-400"
          />
        );
      })}
    </svg>
  );
}
