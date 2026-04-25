/**
 * Definice power-upů pro RPG mód. 1× za level použitelná abilita
 * v PlayerState.powerUp slotu.
 *
 * @author Roman Hlaváček
 * @created 2026-04-25
 */
import type { PowerUpId } from '@/types/rpg';

export interface PowerUpDefinition {
  id: PowerUpId;
  /** Emoji ikona pro UI tlačítka. */
  icon: string;
}

export const POWER_UPS: Record<PowerUpId, PowerUpDefinition> = {
  peek: { id: 'peek', icon: '👁️' },
  shield: { id: 'shield', icon: '🛡️' },
  swap: { id: 'swap', icon: '🔄' },
};

/**
 * IDs zařazené do reward dropping poolu. 'swap' je v typech připraven, ale
 * jeho UI flow (vybrat 2 buňky a prohodit) přijde v další iteraci, aby
 * hráči nedrop dostal nepoužitelný power-up.
 */
export const DROPPABLE_POWER_UP_IDS: PowerUpId[] = ['peek', 'shield'];

