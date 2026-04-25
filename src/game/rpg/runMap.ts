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
import type { NodeType, RunNode } from '@/types/rpg';

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

/**
 * Vytvoří run mapu z fixních blueprints. Mystery a shop nody mají
 * difficulty/mode pole z formálních důvodů (typu RunNode), ale jejich UI
 * neukazuje puzzle.
 */
export function buildRunNodes(): RunNode[] {
  return NODE_BLUEPRINTS.map((bp, index) => ({
    index,
    type: bp.type,
    difficulty: bp.difficulty,
    mode: bp.mode,
    completed: false,
  }));
}

/** True pokud daný typ uzlu spouští puzzle (battle/elite/boss). */
export function isPuzzleNode(type: NodeType): boolean {
  return type === 'battle' || type === 'elite' || type === 'boss';
}
