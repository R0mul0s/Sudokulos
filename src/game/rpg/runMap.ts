/**
 * Generátor run mapy — sekvence uzlů s rostoucí obtížností.
 * MVP: 5 battle uzlů + 1 boss. Delší runy, elity, shop a mystery nody
 * budou přidány ve fázi 8.2.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import type { Difficulty } from '@/types/game';
import type { RunNode } from '@/types/rpg';

/** Obtížnostní křivka podle pořadí uzlu v runu. */
const BATTLE_DIFFICULTIES: Difficulty[] = [
  'easy',
  'easy',
  'medium',
  'medium',
  'hard',
];

/** Obtížnost bosse. */
const BOSS_DIFFICULTY: Difficulty = 'hard';

/** Celkový počet uzlů (5 battle + 1 boss). */
export const RUN_LENGTH = BATTLE_DIFFICULTIES.length + 1;

/**
 * Vytvoří run mapu. Battle uzly jsou klasické sudoku, boss je killer.
 * Nody ještě nejsou completed.
 */
export function buildRunNodes(): RunNode[] {
  const nodes: RunNode[] = BATTLE_DIFFICULTIES.map((difficulty, index) => ({
    index,
    type: 'battle',
    difficulty,
    mode: 'classic',
    completed: false,
  }));
  nodes.push({
    index: nodes.length,
    type: 'boss',
    difficulty: BOSS_DIFFICULTY,
    mode: 'killer',
    completed: false,
  });
  return nodes;
}
