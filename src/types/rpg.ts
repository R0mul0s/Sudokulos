/**
 * RPG roguelike mód — typy pro run, hráčův stav, relics a meta profile.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import type { Difficulty, GameMode } from './game';

export type NodeType = 'battle' | 'elite' | 'mystery' | 'shop' | 'boss';

/** Jeden uzel v run mapě. */
export interface RunNode {
  index: number;
  type: NodeType;
  difficulty: Difficulty;
  mode: GameMode;
  completed: boolean;
}

/** ID třídy postavy. */
export type CharacterClass = 'warrior';

/** ID relicu (bude rozšiřováno s novými relicy). */
export type RelicId =
  | 'amulet_of_insight'
  | 'copper_ring'
  | 'leather_glove'
  | 'dragon_scale'
  | 'phoenix';

export type RelicRarity = 'common' | 'uncommon' | 'rare';

export interface RelicDefinition {
  id: RelicId;
  rarity: RelicRarity;
  /** Cena v gold ve shopu. */
  price: number;
}

/** Získaný relic v aktuálním runu (může mít runtime stav jako "použito"). */
export interface OwnedRelic {
  id: RelicId;
  /** Byl spotřebován (platí jen pro one-shot relics jako Phoenix). */
  consumed: boolean;
}

/** Stav hráče v aktivním runu. */
export interface PlayerState {
  characterClass: CharacterClass;
  maxHp: number;
  hp: number;
  maxMana: number;
  mana: number;
  gold: number;
  relics: OwnedRelic[];
  /** Živé combo z posledního puzzle levelu (reset mezi levely). */
  combo: number;
  /** Nejvyšší combo za celý run. */
  bestComboInRun: number;
}

/** Odměna nabízená po dokončení levelu — hráč si vybírá 1 ze 3. */
export type RewardOption =
  | { kind: 'relic'; relicId: RelicId }
  | { kind: 'gold'; amount: number }
  | { kind: 'potion_hp'; amount: number };

/** Kompletní snapshot aktivního runu. Perzistuje se. */
export interface ActiveRun {
  seed: number;
  nodes: RunNode[];
  currentNodeIndex: number;
  player: PlayerState;
  /** Aktuální nabídnuté odměny (null pokud právě hrajeme nebo nic). */
  pendingRewards: RewardOption[] | null;
  /** Celkový čas strávený v puzzle levelech (ms). */
  elapsedMs: number;
  /** Cumulative mistakes napříč runem (informativní stat). */
  totalMistakes: number;
}

/** Výsledek runu pro statistiky a meta progression. */
export interface RunResult {
  won: boolean;
  levelsCompleted: number;
  totalLevels: number;
  finalHp: number;
  relicIds: RelicId[];
  goldCollected: number;
  bestCombo: number;
  totalMistakes: number;
  elapsedMs: number;
  soulsEarned: number;
  finishedAt: string;
}

/** Meta profil — přežívá smrt runu, drží souls a dlouhodobé statistiky. */
export interface PlayerProfile {
  souls: number;
  totalRuns: number;
  runsWon: number;
  bestRun: RunResult | null;
}
