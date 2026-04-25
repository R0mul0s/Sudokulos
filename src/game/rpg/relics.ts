/**
 * Definice relics pro RPG mód a jejich efektové hooks.
 *
 * Hook systém:
 *   - onRunStart: aplikuje se jednorázově při vytvoření runu (modifikace stats)
 *   - onMistake: runtime hook při chybě — může ji zrušit (přeskočit HP penalty)
 *   - onCorrect: runtime hook při správném tahu — může upravit rewards
 *   - onChainReward: modifikuje gold/mana odměnu z chain reaction
 *   - onLevelEnd: dá bonus gold za level
 *   - onRevive: jednorázový hook, který obživne hráče při HP=0
 *
 * Hooks vrací upravený stav (immutable) nebo null pokud je efekt irelevantní.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import type {
  OwnedRelic,
  PlayerState,
  RelicDefinition,
  RelicId,
} from '@/types/rpg';

export interface RelicRuntime {
  definition: RelicDefinition;
  /** Modifikace startovního PlayerState. Volá se při startu runu. */
  onRunStart?: (player: PlayerState) => PlayerState;
  /**
   * Volá se, když hráč udělá chybu a ještě se nestrhlo HP.
   * Pokud vrátí { consumed, skipMistake: true }, chyba se nepočítá jako mistake
   * (HP se nestrhne). Může označit relic jako consumed.
   */
  onMistake?: (
    player: PlayerState,
    relic: OwnedRelic,
  ) => { player: PlayerState; relic: OwnedRelic; skipMistake: boolean } | null;
  /**
   * Volá se, když by hráč měl zemřít (HP klesne na 0). Může ho obživnout.
   * Pokud vrátí ne-null, aplikuje se navrácený stav místo smrti.
   */
  onRevive?: (
    player: PlayerState,
    relic: OwnedRelic,
  ) => { player: PlayerState; relic: OwnedRelic } | null;
  /** Modifikuje gold odměnu z chain reaction (multiplikativně). */
  chainGoldMultiplier?: number;
  /** Přidá fixní gold po dokončeném levelu. */
  levelEndBonusGold?: number;
  /** Procentuální gold bonus za rychlé dokončení (Flame Crown). */
  fastLevelGoldMultiplier?: number;
  /** Mana navíc na startu každého levelu. */
  manaPerLevelStart?: number;
}

const AMULET_OF_INSIGHT: RelicRuntime = {
  definition: { id: 'amulet_of_insight', rarity: 'common', price: 80 },
  // Efekt amuletu (auto-notes) je vizualizační — aplikuje se v Board komponentě
  // kontrolou relic v runStore; hooks zde nejsou potřeba.
};

const COPPER_RING: RelicRuntime = {
  definition: { id: 'copper_ring', rarity: 'common', price: 60 },
  levelEndBonusGold: 10,
};

const LEATHER_GLOVE: RelicRuntime = {
  definition: { id: 'leather_glove', rarity: 'common', price: 70 },
  onRunStart: (player) => ({
    ...player,
    maxHp: player.maxHp + 1,
    hp: player.hp + 1,
  }),
};

const DRAGON_SCALE: RelicRuntime = {
  definition: { id: 'dragon_scale', rarity: 'uncommon', price: 140 },
  // Odpustí první chybu v každém levelu — implementováno ne přes onMistake
  // (ten reaguje na relic stav), ale přes runStore level state (firstMistakeForgiven).
};

const PHOENIX: RelicRuntime = {
  definition: { id: 'phoenix', rarity: 'rare', price: 280 },
  onRevive: (player, relic) => {
    if (relic.consumed) return null;
    return {
      player: { ...player, hp: 1 },
      relic: { ...relic, consumed: true },
    };
  },
};

const SILVER_CHAIN: RelicRuntime = {
  definition: { id: 'silver_chain', rarity: 'common', price: 70 },
  onRunStart: (player) => ({
    ...player,
    maxMana: player.maxMana + 5,
    mana: player.mana + 5,
  }),
};

const MANA_VIAL: RelicRuntime = {
  definition: { id: 'mana_vial', rarity: 'common', price: 60 },
  manaPerLevelStart: 5,
};

const FLAME_CROWN: RelicRuntime = {
  definition: { id: 'flame_crown', rarity: 'uncommon', price: 160 },
  // 25% bonus z fast-level rewardu (zacházení v finishCurrentLevel).
  fastLevelGoldMultiplier: 1.25,
};

const SPELL_BOOK: RelicRuntime = {
  definition: { id: 'spell_book', rarity: 'uncommon', price: 180 },
  // Power-up sloty mají 2 charges místo 1 (interakce v applyReward).
};

const SHARP_EYE: RelicRuntime = {
  definition: { id: 'sharp_eye', rarity: 'uncommon', price: 150 },
  // Peer highlight rozšířen o diagonálně sousedící buňky (interakce v Board).
};

export const RELICS: Record<RelicId, RelicRuntime> = {
  amulet_of_insight: AMULET_OF_INSIGHT,
  copper_ring: COPPER_RING,
  leather_glove: LEATHER_GLOVE,
  dragon_scale: DRAGON_SCALE,
  phoenix: PHOENIX,
  silver_chain: SILVER_CHAIN,
  mana_vial: MANA_VIAL,
  flame_crown: FLAME_CROWN,
  spell_book: SPELL_BOOK,
  sharp_eye: SHARP_EYE,
};

export const ALL_RELIC_IDS: RelicId[] = Object.keys(RELICS) as RelicId[];

export function getRelic(id: RelicId): RelicRuntime {
  return RELICS[id];
}

/**
 * Aplikuje onRunStart hooks všech relics na playera (pro případ že hráč startuje
 * run s už nějakým startovním relicem). Pro MVP startuje bez relics, ale hook
 * je připraven pro budoucí starter relics třídy.
 */
export function applyOnRunStart(
  player: PlayerState,
  relics: readonly OwnedRelic[],
): PlayerState {
  let updated = player;
  for (const owned of relics) {
    const hook = RELICS[owned.id]?.onRunStart;
    if (hook) updated = hook(updated);
  }
  return updated;
}

/** True pokud hráč má relic v runu (a není consumed). */
export function hasActiveRelic(
  relics: readonly OwnedRelic[],
  id: RelicId,
): boolean {
  return relics.some((r) => r.id === id && !r.consumed);
}
