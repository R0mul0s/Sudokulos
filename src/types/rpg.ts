/**
 * RPG roguelike mód — typy pro run, hráčův stav, relics a meta profile.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import type { Difficulty, GameMode } from './game';

export type NodeType = 'battle' | 'elite' | 'mystery' | 'shop' | 'boss';

/**
 * Environmental effect aktivní během puzzle levelu.
 * - storm: každých 60 s smaže náhodnou poznámku
 * - light: při startu levelu −1 HP, ale fast-level threshold se prodlouží o 30 s
 */
export type EnvEffect = 'storm' | 'light';

/** Jeden uzel v run mapě. */
export interface RunNode {
  index: number;
  type: NodeType;
  difficulty: Difficulty;
  mode: GameMode;
  completed: boolean;
  /** Volitelný environmentální efekt — nastaven jen na elite a boss uzlech. */
  envEffect?: EnvEffect;
}

/** ID třídy postavy. */
export type CharacterClass = 'warrior' | 'mage' | 'monk';

/** ID relicu (bude rozšiřováno s novými relicy). */
export type RelicId =
  | 'amulet_of_insight'
  | 'copper_ring'
  | 'leather_glove'
  | 'dragon_scale'
  | 'phoenix'
  | 'silver_chain'
  | 'mana_vial'
  | 'flame_crown'
  | 'spell_book'
  | 'sharp_eye'
  | 'stone_totem'
  | 'shadow'
  | 'blood_altar'
  | 'golden_pact'
  | 'time_dilation';

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

export type PowerUpId = 'peek' | 'shield' | 'swap';

export interface PowerUpSlot {
  id: PowerUpId;
  /** Kolik nábojů ještě zbývá (1 default; relic Spell Book může dát 2). */
  charges: number;
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
  /** Maximálně 1 power-up najednou. Null pokud žádný. */
  powerUp: PowerUpSlot | null;
  /** Živé combo z posledního puzzle levelu (reset mezi levely). */
  combo: number;
  /** Nejvyšší combo za celý run. */
  bestComboInRun: number;
}

/** Odměna nabízená po dokončení levelu — hráč si vybírá 1 ze 3. */
export type RewardOption =
  | { kind: 'relic'; relicId: RelicId }
  | { kind: 'gold'; amount: number }
  | { kind: 'potion_hp'; amount: number }
  | { kind: 'power_up'; powerUpId: PowerUpId };

/** Mystery událost na mystery uzlu. */
export type MysteryEvent =
  | { kind: 'altar'; relicId: RelicId; hpCost: number }
  | { kind: 'rest'; hpHeal: number }
  | { kind: 'chest_gold'; amount: number }
  | { kind: 'chest_scroll'; powerUpId: PowerUpId };

/** Položka v obchodě. */
export type ShopItem =
  | { kind: 'relic'; relicId: RelicId; price: number }
  | { kind: 'potion_hp'; price: number }
  | { kind: 'power_up'; powerUpId: PowerUpId; price: number };

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
  /** Pozice lucky cells pro aktuální level (`row,col` keys). Reset mezi levely. */
  luckyCells: string[];
}

/** Výsledek runu pro statistiky a meta progression. */
export interface RunResult {
  characterClass: CharacterClass;
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

export interface ClassRunStats {
  played: number;
  won: number;
}

/** Meta profil — přežívá smrt runu, drží souls a dlouhodobé statistiky. */
export interface PlayerProfile {
  souls: number;
  totalRuns: number;
  runsWon: number;
  bestRun: RunResult | null;
  /** Třídy, které si hráč odemkl. Warrior je odemčený od začátku. */
  unlockedClasses: CharacterClass[];
  /** Relics dostupné v dropping pool. Common + uncommon defaultně, rare odemyká hráč. */
  unlockedRelics: RelicId[];
  /** Per-třída agregace dohraných runů. */
  perClassRuns: Partial<Record<CharacterClass, ClassRunStats>>;
}
