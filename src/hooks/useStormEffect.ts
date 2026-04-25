/**
 * Storm environmental effect — každých 60 s smaže náhodnou poznámku.
 * Aktivní jen když je hráč v puzzle uzlu s envEffect === 'storm'.
 *
 * @author Roman Hlaváček
 * @created 2026-04-25
 */
import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useRunStore } from '@/store/runStore';

const STORM_INTERVAL_MS = 60_000;

export function useStormEffect(): void {
  const status = useGameStore((s) => s.status);
  const deleteRandomNote = useGameStore((s) => s.deleteRandomNote);
  const isStormActive = useRunStore((s) => {
    if (!s.run) return false;
    const node = s.run.nodes[s.run.currentNodeIndex];
    return node?.envEffect === 'storm';
  });

  useEffect(() => {
    if (status !== 'playing' || !isStormActive) return;
    const id = window.setInterval(() => {
      deleteRandomNote();
    }, STORM_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [status, isStormActive, deleteRandomNote]);
}
