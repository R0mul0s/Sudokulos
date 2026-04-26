/**
 * Side-effect manager pro RPG run uvnitř GameScreen.
 * Spouští environmentální hooks (Storm, Frost) jen když je aktivní run —
 * v klasickém / killer módu se vůbec nemontuje, takže žádné runStore
 * subscribery z těchto hooks nevznikají.
 *
 * @author Roman Hlaváček
 * @created 2026-04-26
 */
import { useStormEffect } from '@/hooks/useStormEffect';
import { useFrostEffect } from '@/hooks/useFrostEffect';

export function RpgEffectsManager(): null {
  useStormEffect();
  useFrostEffect();
  return null;
}
