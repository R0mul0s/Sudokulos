/**
 * Generátor run mapy — sekvence uzlů s mixem typů a rostoucí obtížností.
 * Aktuální struktura (8 uzlů):
 *   battle (easy) → battle (easy) → mystery → battle (medium) →
 *   elite (hard killer) → shop → battle (hard) → boss (killer hard)
 *
 * Elite je tvrdší předskok bossovi a garantuje rare drop. Shop dává
 * možnost utratit našetřené zlato. Mystery vnáší náhodný taktický rozhodovací
 * moment (HP / gold / relic).
 *
 * @author Roman Hlaváček
 * @created 2026-04-25
 */
import type { Difficulty, GameMode } from '@/types/game';
import type { EnvEffect, NodeType, RunNode } from '@/types/rpg';
import type { Rng } from '../rng';

interface NodeBlueprint {
  type: NodeType;
  difficulty: Difficulty;
  mode: GameMode;
}

/** Pevné pořadí uzlů v MVP runu — ladění balansu se dělá přes tato čísla. */
const NODE_BLUEPRINTS: NodeBlueprint[] = [
  { type: 'battle', difficulty: 'easy', mode: 'classic' },
  { type: 'battle', difficulty: 'easy', mode: 'classic' },
  { type: 'mystery', difficulty: 'easy', mode: 'classic' },
  { type: 'battle', difficulty: 'medium', mode: 'classic' },
  { type: 'elite', difficulty: 'hard', mode: 'killer' },
  { type: 'shop', difficulty: 'easy', mode: 'classic' },
  { type: 'battle', difficulty: 'hard', mode: 'classic' },
  { type: 'boss', difficulty: 'hard', mode: 'killer' },
];

export const RUN_LENGTH = NODE_BLUEPRINTS.length;

const ENV_EFFECTS: EnvEffect[] = ['storm', 'light', 'frost', 'dark'];

/**
 * Vytvoří run mapu z fixních blueprints. Mystery a shop nody mají
 * difficulty/mode pole z formálních důvodů (typu RunNode), ale jejich UI
 * neukazuje puzzle. Elite a boss uzly dostanou náhodný env effect.
 */
export function buildRunNodes(rng?: Rng): RunNode[] {
  return NODE_BLUEPRINTS.map((bp, index) => {
    const node: RunNode = {
      index,
      type: bp.type,
      difficulty: bp.difficulty,
      mode: bp.mode,
      completed: false,
    };
    if ((bp.type === 'elite' || bp.type === 'boss') && rng) {
      const idx = Math.floor(rng() * ENV_EFFECTS.length);
      node.envEffect = ENV_EFFECTS[idx];
    }
    return node;
  });
}

/** True pokud daný typ uzlu spouští puzzle (battle/elite/boss). */
export function isPuzzleNode(type: NodeType): boolean {
  return type === 'battle' || type === 'elite' || type === 'boss';
}
