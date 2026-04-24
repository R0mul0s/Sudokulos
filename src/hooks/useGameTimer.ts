/**
 * Hook, který udržuje herní čas přes useGameStore.tick.
 * Tik volá requestAnimationFrame smyčkou — plynulé UI bez drift problémů setInterval.
 * Automaticky se zastaví, když hra není ve stavu 'playing'.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';

export function useGameTimer(): void {
  const status = useGameStore((s) => s.status);
  const tick = useGameStore((s) => s.tick);

  useEffect(() => {
    if (status !== 'playing') return;

    let rafId = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const delta = now - last;
      last = now;
      tick(delta);
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [status, tick]);
}
