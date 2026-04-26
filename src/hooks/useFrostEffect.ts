/**
 * Frost environmental effect — drží 2 zamrzlé prázdné buňky, které nelze
 * editovat. Každých 20 s rotuje výběr (vybere nové).
 * Aktivní jen v puzzle uzlu s envEffect === 'frost'.
 *
 * @author Roman Hlaváček
 * @created 2026-04-25
 */
import { useEffect } from 'react';
import { BOARD_SIZE, EMPTY_CELL } from '@/game/constants';
import { useGameStore } from '@/store/gameStore';
import { useRunStore } from '@/store/runStore';

const FROST_INTERVAL_MS = 20_000;
const FROST_CELL_COUNT = 2;

export function useFrostEffect(): void {
  const status = useGameStore((s) => s.status);
  const freezeRandomCells = useRunStore((s) => s.freezeRandomCells);
  const isFrostActive = useRunStore((s) => {
    if (!s.run) return false;
    const node = s.run.nodes[s.run.currentNodeIndex];
    return node?.envEffect === 'frost';
  });

  useEffect(() => {
    if (status !== 'playing' || !isFrostActive) {
      // Při deaktivaci uklidíme zbytkové frozen cells.
      const current =
        useRunStore.getState().levelState.frozenCells ?? [];
      if (current.length > 0) {
        useRunStore.setState((s) => ({
          levelState: { ...s.levelState, frozenCells: [] },
        }));
      }
      return;
    }
    const refresh = () => {
      const currentBoard = useGameStore.getState().board;
      if (!currentBoard) return;
      const empty: Array<[number, number]> = [];
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (
            !currentBoard[r][c].given &&
            currentBoard[r][c].value === EMPTY_CELL
          ) {
            empty.push([r, c]);
          }
        }
      }
      freezeRandomCells(empty, FROST_CELL_COUNT);
    };
    refresh();
    const id = window.setInterval(refresh, FROST_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [status, isFrostActive, freezeRandomCells]);
}
