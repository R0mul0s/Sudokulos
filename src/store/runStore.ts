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
  RelicId,
  RewardOption,
  RunNode,
  RunResult,
} from '@/types/rpg';
import { ALL_RELIC_IDS, applyOnRunStart, RELICS } from '@/game/rpg/relics';
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

interface LevelState {
  /** Obtížnost odmazávání chyb — Dragon scale odpustí první chybu v levelu. */
  firstMistakeForgiven: boolean;
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
  finishCurrentLevel: (elapsedMs: number) => void;
  chooseReward: (optionIndex: number) => void;
  abandonRun: () => void;
  acknowledgeResult: () => void;
}

export type RunStore = RunState & RunActions;

const INITIAL_STATE: RunState = {
  run: null,
  result: null,
  levelState: { firstMistakeForgiven: false },
};

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
    if (roll < 0.45 && available.length > 0) {
      const idx = Math.floor(rng() * available.length);
      const relicId = available.splice(idx, 1)[0] as RelicId;
      options.push({ kind: 'relic', relicId });
      continue;
    }
    if (roll < 0.75) {
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
        };
        set({
          run,
          result: null,
          levelState: { firstMistakeForgiven: false },
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

        // Dragon scale — odpouští první chybu v levelu.
        const hasDragonScale = run.player.relics.some(
          (r) => r.id === 'dragon_scale' && !r.consumed,
        );
        if (hasDragonScale && !levelState.firstMistakeForgiven) {
          set({
            levelState: { firstMistakeForgiven: true },
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
        if (elapsedMs < FAST_LEVEL_THRESHOLD_MS) bonusGold += LEVEL_END_FAST_BONUS;
        for (const owned of run.player.relics) {
          const extra = RELICS[owned.id]?.levelEndBonusGold ?? 0;
          bonusGold += extra;
        }

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

        const nextPlayer = applyReward(run.player, option);
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
          },
          levelState: { firstMistakeForgiven: false },
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
