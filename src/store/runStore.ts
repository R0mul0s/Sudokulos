/**
 * Aktivní RPG run — HP, mana, gold, relics, combo, progression mezi uzly.
 * Persistuje do localStorage, aby hráč mohl pokračovat i po zavření aplikace.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  ActiveRun,
  CharacterClass,
  OwnedRelic,
  PlayerState,
  PowerUpId,
  RelicId,
  RewardOption,
  RunNode,
  RunResult,
} from '@/types/rpg';
import { ALL_RELIC_IDS, applyOnRunStart, RELICS } from '@/game/rpg/relics';
import { DROPPABLE_POWER_UP_IDS } from '@/game/rpg/powerUps';
import { buildRunNodes, RUN_LENGTH } from '@/game/rpg/runMap';
import { createRng, type Rng } from '@/game/rng';
import { useProfileStore } from './profileStore';

/** Odměna při dokončení běžného levelu. */
const LEVEL_END_GOLD_BASE = 40;
/** Bonus zlata za rychlé dokončení (pod 3 min). */
const LEVEL_END_FAST_BONUS = 20;
const FAST_LEVEL_THRESHOLD_MS = 3 * 60 * 1000;
/** Souls za každý dokončený uzel. */
const SOULS_PER_LEVEL = 15;
/** Základní bonus za start runu (hráč vždy něco dostane). */
const SOULS_ATTEMPT_BONUS = 5;
/** Souls bonus za výhru runu. */
const SOULS_WIN_BONUS = 120;
/** Gold bonus za chain reaction (per dokončenou skupinu — row/col/block). */
const CHAIN_GOLD_PER_GROUP = 25;
/** Mana bonus za chain. */
const CHAIN_MANA_PER_GROUP = 5;
/** Combo bonus gold per tah (od combo ≥ 2). */
const COMBO_GOLD_PER_STEP = 3;

const DEFAULT_CLASS_STATS: Record<
  CharacterClass,
  Pick<PlayerState, 'maxHp' | 'hp' | 'maxMana' | 'mana'>
> = {
  warrior: { maxHp: 3, hp: 3, maxMana: 10, mana: 0 },
};

interface PeekState {
  row: number;
  col: number;
  value: number;
  /** Date.now() limit, po kterém peek vyprší. */
  untilTimestamp: number;
}

interface LevelState {
  /** Dragon scale odpustí první chybu v levelu. */
  firstMistakeForgiven: boolean;
  /** Power-up Shield aktivní — pohltí příští mistake. */
  shieldActive: boolean;
  /** Aktuální peek odhalení (3 s viditelnost správné hodnoty). */
  peek: PeekState | null;
  /** Souls bonus a HP penalty za lucky cells, které byly v levelu zatím vyřešené. */
  consumedLuckyCells: string[];
}

interface RunState {
  run: ActiveRun | null;
  result: RunResult | null;
  /** Per-level stav (reset při vstupu do nového uzlu). */
  levelState: LevelState;
}

interface RunActions {
  startRun: (characterClass?: CharacterClass, seed?: number) => void;
  currentNode: () => RunNode | null;
  recordMistake: () => void;
  recordCorrect: (chainCount: number) => void;
  recordLuckyHit: (row: number, col: number, correct: boolean) => void;
  finishCurrentLevel: (elapsedMs: number) => void;
  chooseReward: (optionIndex: number) => void;
  abandonRun: () => void;
  acknowledgeResult: () => void;
  /** Vygeneruje lucky cells pro daný level z prázdných buněk. */
  initLuckyCells: (emptyCellPositions: Array<[number, number]>) => void;
  /** Aktivuje Peek na buňce; vyžaduje powerUp.id === 'peek'. Vrací true pokud uspěl. */
  activatePeek: (row: number, col: number, correctValue: number) => boolean;
  /** Aktivuje Shield. Vrací true pokud uspěl. */
  activateShield: () => boolean;
}

export type RunStore = RunState & RunActions;

const INITIAL_LEVEL_STATE: LevelState = {
  firstMistakeForgiven: false,
  shieldActive: false,
  peek: null,
  consumedLuckyCells: [],
};

const INITIAL_STATE: RunState = {
  run: null,
  result: null,
  levelState: INITIAL_LEVEL_STATE,
};

/** Délka peek efektu v ms. */
const PEEK_DURATION_MS = 3_000;
/** Bonus za správně vyplněnou lucky cell (gold). */
const LUCKY_GOLD_REWARD = 30;
/** Bonus za správně vyplněnou lucky cell (mana). */
const LUCKY_MANA_REWARD = 4;
/** Extra HP penalty za špatně vyplněnou lucky cell (přijde nad běžný recordMistake). */
const LUCKY_PENALTY_HP = 1;
/** Počet lucky cells na startu levelu. */
const LUCKY_CELLS_PER_LEVEL = 3;

/**
 * Aplikuje "revive" hooks všech relics, pokud HP klesne na 0.
 * Vrátí upravený player a aktualizované relics.
 */
function tryRevive(
  player: PlayerState,
): { player: PlayerState; relics: OwnedRelic[] } | null {
  const nextRelics = [...player.relics];
  for (let i = 0; i < nextRelics.length; i++) {
    const relic = nextRelics[i];
    const hook = RELICS[relic.id]?.onRevive;
    if (!hook) continue;
    const result = hook(player, relic);
    if (result) {
      nextRelics[i] = result.relic;
      return { player: { ...result.player, relics: nextRelics }, relics: nextRelics };
    }
  }
  return null;
}

/** Vygeneruje 3 náhodné reward options. */
function generateRewards(player: PlayerState, rng: Rng): RewardOption[] {
  const available = ALL_RELIC_IDS.filter(
    (id) => !player.relics.some((r) => r.id === id),
  );
  const options: RewardOption[] = [];
  for (let i = 0; i < 3; i++) {
    const roll = rng();
    if (roll < 0.4 && available.length > 0) {
      const idx = Math.floor(rng() * available.length);
      const relicId = available.splice(idx, 1)[0] as RelicId;
      options.push({ kind: 'relic', relicId });
      continue;
    }
    if (roll < 0.6) {
      const powerUpIdx = Math.floor(rng() * DROPPABLE_POWER_UP_IDS.length);
      options.push({
        kind: 'power_up',
        powerUpId: DROPPABLE_POWER_UP_IDS[powerUpIdx] as PowerUpId,
      });
      continue;
    }
    if (roll < 0.85) {
      const amount = 30 + Math.floor(rng() * 50);
      options.push({ kind: 'gold', amount });
      continue;
    }
    options.push({ kind: 'potion_hp', amount: 1 });
  }
  return options;
}

/** Spočítá výsledek runu (úspěch / smrt) pro uložení do profile. */
function buildRunResult(
  run: ActiveRun,
  won: boolean,
  levelsCompleted: number,
): RunResult {
  const soulsEarned =
    SOULS_ATTEMPT_BONUS +
    levelsCompleted * SOULS_PER_LEVEL +
    (won ? SOULS_WIN_BONUS : 0);
  return {
    won,
    levelsCompleted,
    totalLevels: RUN_LENGTH,
    finalHp: run.player.hp,
    relicIds: run.player.relics.map((r) => r.id),
    goldCollected: run.player.gold,
    bestCombo: run.player.bestComboInRun,
    totalMistakes: run.totalMistakes,
    elapsedMs: run.elapsedMs,
    soulsEarned,
    finishedAt: new Date().toISOString(),
  };
}

/**
 * Aplikuje reward na player state. Vrátí nového playera.
 */
function applyReward(player: PlayerState, reward: RewardOption): PlayerState {
  switch (reward.kind) {
    case 'gold':
      return { ...player, gold: player.gold + reward.amount };
    case 'potion_hp':
      return {
        ...player,
        hp: Math.min(player.maxHp, player.hp + reward.amount),
      };
    case 'relic': {
      const newRelic: OwnedRelic = { id: reward.relicId, consumed: false };
      const hook = RELICS[reward.relicId]?.onRunStart;
      const afterHook = hook ? hook(player) : player;
      return { ...afterHook, relics: [...afterHook.relics, newRelic] };
    }
    case 'power_up': {
      const hasSpellBook = player.relics.some(
        (r) => r.id === 'spell_book' && !r.consumed,
      );
      const charges = hasSpellBook ? 2 : 1;
      return {
        ...player,
        powerUp: { id: reward.powerUpId, charges },
      };
    }
  }
}

export const useRunStore = create<RunStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      startRun: (characterClass = 'warrior', seed = Date.now()) => {
        const baseStats = DEFAULT_CLASS_STATS[characterClass];
        const basePlayer: PlayerState = {
          characterClass,
          ...baseStats,
          gold: 0,
          relics: [],
          powerUp: null,
          combo: 0,
          bestComboInRun: 0,
        };
        const player = applyOnRunStart(basePlayer, basePlayer.relics);
        const run: ActiveRun = {
          seed,
          nodes: buildRunNodes(),
          currentNodeIndex: 0,
          player,
          pendingRewards: null,
          elapsedMs: 0,
          totalMistakes: 0,
          luckyCells: [],
        };
        set({
          run,
          result: null,
          levelState: { ...INITIAL_LEVEL_STATE, consumedLuckyCells: [] },
        });
      },

      currentNode: () => {
        const { run } = get();
        if (!run) return null;
        return run.nodes[run.currentNodeIndex] ?? null;
      },

      recordMistake: () => {
        const { run, levelState } = get();
        if (!run) return;

        // Shield power-up — pohltí příští mistake.
        if (levelState.shieldActive) {
          set({
            levelState: { ...levelState, shieldActive: false },
            run: {
              ...run,
              player: { ...run.player, combo: 0 },
            },
          });
          return;
        }

        // Dragon scale — odpouští první chybu v levelu.
        const hasDragonScale = run.player.relics.some(
          (r) => r.id === 'dragon_scale' && !r.consumed,
        );
        if (hasDragonScale && !levelState.firstMistakeForgiven) {
          set({
            levelState: { ...levelState, firstMistakeForgiven: true },
            run: {
              ...run,
              player: { ...run.player, combo: 0 },
            },
          });
          return;
        }

        const nextHp = run.player.hp - 1;
        const nextPlayer: PlayerState = {
          ...run.player,
          hp: nextHp,
          combo: 0,
        };
        const nextRun: ActiveRun = {
          ...run,
          player: nextPlayer,
          totalMistakes: run.totalMistakes + 1,
        };

        if (nextHp <= 0) {
          // Pokus o revive.
          const revived = tryRevive(nextPlayer);
          if (revived) {
            set({
              run: { ...nextRun, player: revived.player },
            });
            return;
          }
          // Smrt — ukončit run.
          const result = buildRunResult(
            nextRun,
            false,
            nextRun.currentNodeIndex,
          );
          useProfileStore.getState().recordRunResult(result);
          set({ run: null, result });
          return;
        }

        set({ run: nextRun });
      },

      recordCorrect: (chainCount) => {
        const { run } = get();
        if (!run) return;

        const newCombo = run.player.combo + 1;
        let goldGain = 0;
        let manaGain = 0;

        if (newCombo >= 2) {
          goldGain += COMBO_GOLD_PER_STEP * (newCombo - 1);
          manaGain += 1;
        }
        if (chainCount > 0) {
          goldGain += CHAIN_GOLD_PER_GROUP * chainCount;
          manaGain += CHAIN_MANA_PER_GROUP * chainCount;
        }

        const nextPlayer: PlayerState = {
          ...run.player,
          combo: newCombo,
          bestComboInRun: Math.max(run.player.bestComboInRun, newCombo),
          gold: run.player.gold + goldGain,
          mana: Math.min(run.player.maxMana, run.player.mana + manaGain),
        };
        set({ run: { ...run, player: nextPlayer } });
      },

      finishCurrentLevel: (elapsedMs) => {
        const { run } = get();
        if (!run) return;

        // Gold bonus za dokončení levelu + případný bonus za rychlost + relic bonusy.
        let bonusGold = LEVEL_END_GOLD_BASE;
        let fastBonus =
          elapsedMs < FAST_LEVEL_THRESHOLD_MS ? LEVEL_END_FAST_BONUS : 0;
        let fastMultiplier = 1;
        for (const owned of run.player.relics) {
          if (owned.consumed) continue;
          const def = RELICS[owned.id];
          bonusGold += def?.levelEndBonusGold ?? 0;
          if (def?.fastLevelGoldMultiplier) {
            fastMultiplier = Math.max(
              fastMultiplier,
              def.fastLevelGoldMultiplier,
            );
          }
        }
        bonusGold += Math.floor(fastBonus * fastMultiplier);

        const updatedNodes = run.nodes.map((n, i) =>
          i === run.currentNodeIndex ? { ...n, completed: true } : n,
        );
        const rng = createRng(run.seed + run.currentNodeIndex + 1);
        const pendingRewards = generateRewards(run.player, rng);
        const nextPlayer: PlayerState = {
          ...run.player,
          gold: run.player.gold + bonusGold,
          combo: 0,
        };
        set({
          run: {
            ...run,
            nodes: updatedNodes,
            player: nextPlayer,
            pendingRewards,
            elapsedMs: run.elapsedMs + elapsedMs,
          },
        });
      },

      chooseReward: (optionIndex) => {
        const { run } = get();
        if (!run || !run.pendingRewards) return;
        const option = run.pendingRewards[optionIndex];
        if (!option) return;

        let nextPlayer = applyReward(run.player, option);
        // Mana Vial a podobné relics dávající mana na startu dalšího levelu.
        let manaBoost = 0;
        for (const owned of nextPlayer.relics) {
          if (owned.consumed) continue;
          manaBoost += RELICS[owned.id]?.manaPerLevelStart ?? 0;
        }
        if (manaBoost > 0) {
          nextPlayer = {
            ...nextPlayer,
            mana: Math.min(nextPlayer.maxMana, nextPlayer.mana + manaBoost),
          };
        }
        const nextNodeIndex = run.currentNodeIndex + 1;

        // Pokud byl poslední uzel, run je vyhraný.
        if (nextNodeIndex >= RUN_LENGTH) {
          const nextRun: ActiveRun = {
            ...run,
            player: nextPlayer,
            pendingRewards: null,
          };
          const result = buildRunResult(nextRun, true, RUN_LENGTH);
          useProfileStore.getState().recordRunResult(result);
          set({ run: null, result });
          return;
        }

        set({
          run: {
            ...run,
            player: nextPlayer,
            pendingRewards: null,
            currentNodeIndex: nextNodeIndex,
            luckyCells: [],
          },
          levelState: { ...INITIAL_LEVEL_STATE, consumedLuckyCells: [] },
        });
      },

      abandonRun: () => {
        const { run } = get();
        if (run) {
          const result = buildRunResult(run, false, run.currentNodeIndex);
          useProfileStore.getState().recordRunResult(result);
          set({ run: null, result });
          return;
        }
        set({ ...INITIAL_STATE });
      },

      acknowledgeResult: () => {
        set({ result: null });
      },

      initLuckyCells: (emptyCellPositions) => {
        const { run } = get();
        if (!run) return;
        const rng = createRng(run.seed + run.currentNodeIndex * 7919);
        // Fisher-Yates pick N
        const positions = emptyCellPositions.slice();
        for (let i = positions.length - 1; i > 0; i--) {
          const j = Math.floor(rng() * (i + 1));
          [positions[i], positions[j]] = [positions[j], positions[i]];
        }
        const picked = positions
          .slice(0, Math.min(LUCKY_CELLS_PER_LEVEL, positions.length))
          .map(([r, c]) => `${r},${c}`);
        set({
          run: { ...run, luckyCells: picked },
          levelState: { ...get().levelState, consumedLuckyCells: [] },
        });
      },

      recordLuckyHit: (row, col, correct) => {
        const { run, levelState } = get();
        if (!run) return;
        const key = `${row},${col}`;
        if (!run.luckyCells.includes(key)) return;
        if (levelState.consumedLuckyCells.includes(key)) return;

        const consumed = [...levelState.consumedLuckyCells, key];

        if (correct) {
          const nextPlayer: PlayerState = {
            ...run.player,
            gold: run.player.gold + LUCKY_GOLD_REWARD,
            mana: Math.min(
              run.player.maxMana,
              run.player.mana + LUCKY_MANA_REWARD,
            ),
          };
          set({
            run: { ...run, player: nextPlayer },
            levelState: { ...levelState, consumedLuckyCells: consumed },
          });
          return;
        }

        // Špatná lucky cell — extra HP penalty (běžná recordMistake už šla zvlášť).
        const nextHp = run.player.hp - LUCKY_PENALTY_HP;
        const nextPlayer: PlayerState = { ...run.player, hp: nextHp };
        const nextRun = { ...run, player: nextPlayer };

        if (nextHp <= 0) {
          const revived = tryRevive(nextPlayer);
          if (revived) {
            set({
              run: { ...nextRun, player: revived.player },
              levelState: { ...levelState, consumedLuckyCells: consumed },
            });
            return;
          }
          const result = buildRunResult(nextRun, false, run.currentNodeIndex);
          useProfileStore.getState().recordRunResult(result);
          set({ run: null, result, levelState: INITIAL_LEVEL_STATE });
          return;
        }

        set({
          run: nextRun,
          levelState: { ...levelState, consumedLuckyCells: consumed },
        });
      },

      activatePeek: (row, col, correctValue) => {
        const { run, levelState } = get();
        if (!run || !run.player.powerUp || run.player.powerUp.id !== 'peek') {
          return false;
        }
        const nextCharges = run.player.powerUp.charges - 1;
        const nextPlayer: PlayerState = {
          ...run.player,
          powerUp:
            nextCharges > 0
              ? { ...run.player.powerUp, charges: nextCharges }
              : null,
        };
        const until = Date.now() + PEEK_DURATION_MS;
        set({
          run: { ...run, player: nextPlayer },
          levelState: {
            ...levelState,
            peek: { row, col, value: correctValue, untilTimestamp: until },
          },
        });
        // Auto-expire — pokud peek nebyl mezitím přepsán, zruš ho.
        if (typeof window !== 'undefined') {
          window.setTimeout(() => {
            const current = get().levelState.peek;
            if (current && current.untilTimestamp === until) {
              set({
                levelState: { ...get().levelState, peek: null },
              });
            }
          }, PEEK_DURATION_MS + 50);
        }
        return true;
      },

      activateShield: () => {
        const { run, levelState } = get();
        if (!run || !run.player.powerUp || run.player.powerUp.id !== 'shield') {
          return false;
        }
        const nextCharges = run.player.powerUp.charges - 1;
        const nextPlayer: PlayerState = {
          ...run.player,
          powerUp:
            nextCharges > 0
              ? { ...run.player.powerUp, charges: nextCharges }
              : null,
        };
        set({
          run: { ...run, player: nextPlayer },
          levelState: { ...levelState, shieldActive: true },
        });
        return true;
      },
    }),
    {
      name: 'sudoku.run',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({
        run: state.run,
        levelState: state.levelState,
      }),
    },
  ),
);
