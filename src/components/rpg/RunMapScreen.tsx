/**
 * Obrazovka mapy runu — hráč vidí postup mezi uzly, aktuální pozici
 * a spouští další level.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { useTranslation } from 'react-i18next';
import type { NodeType, RelicId, RunNode } from '@/types/rpg';
import { useRunStore } from '@/store/runStore';
import { useGameStore } from '@/store/gameStore';

const NODE_EMOJI: Record<NodeType, string> = {
  battle: '⚔️',
  elite: '💀',
  mystery: '❓',
  shop: '🏪',
  boss: '👑',
};

const RELIC_EMOJI: Record<RelicId, string> = {
  amulet_of_insight: '🔮',
  copper_ring: '💍',
  leather_glove: '🧤',
  dragon_scale: '🛡️',
  phoenix: '🦅',
};

interface NodePillProps {
  node: RunNode;
  isCurrent: boolean;
}

function NodePill({ node, isCurrent }: NodePillProps) {
  const { t } = useTranslation();
  const stateClass = node.completed
    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
    : isCurrent
      ? 'bg-slate-900 text-white ring-2 ring-amber-400 dark:bg-slate-100 dark:text-slate-900'
      : 'bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-200';
  return (
    <div
      className={[
        'flex h-14 w-14 flex-col items-center justify-center rounded-2xl shadow-sm transition',
        stateClass,
      ].join(' ')}
      aria-current={isCurrent ? 'step' : undefined}
    >
      <span className="text-xl leading-none">{NODE_EMOJI[node.type]}</span>
      <span className="text-[10px] uppercase tracking-wide">
        {t(`difficulty.${node.difficulty}`)}
      </span>
    </div>
  );
}

interface RunMapScreenProps {
  onStartLevel: () => void;
  onAbandon: () => void;
}

export function RunMapScreen({ onStartLevel, onAbandon }: RunMapScreenProps) {
  const { t } = useTranslation();
  const run = useRunStore((s) => s.run);
  const abandonRun = useRunStore((s) => s.abandonRun);
  const abandonGame = useGameStore((s) => s.abandonGame);
  if (!run) return null;

  const { nodes, currentNodeIndex, player } = run;
  const currentNode = nodes[currentNodeIndex];

  const handleAbandon = () => {
    if (!window.confirm(t('rpg.confirmAbandon'))) return;
    abandonRun();
    abandonGame();
    onAbandon();
  };

  return (
    <div className="flex w-full flex-col gap-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {t('rpg.mapTitle')}
        </h1>
        <button
          type="button"
          onClick={handleAbandon}
          className="text-sm text-red-600 underline-offset-4 hover:underline"
        >
          {t('rpg.abandon')}
        </button>
      </header>

      <section className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
        <div className="flex items-center justify-between text-sm text-slate-900 dark:text-slate-100">
          <span className="flex items-center gap-2">
            <span className="text-base">❤️</span>
            <span className="font-semibold tabular-nums">
              {player.hp} / {player.maxHp}
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span className="text-base">💰</span>
            <span className="font-semibold tabular-nums">{player.gold}</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="text-base">🔥</span>
            <span className="font-semibold tabular-nums">
              {player.bestComboInRun}
            </span>
          </span>
        </div>
        {player.relics.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {player.relics.map((r) => (
              <span
                key={r.id}
                title={t(`rpg.relic.${r.id}.name`)}
                className={[
                  'rounded-lg bg-slate-100 px-2 py-1 text-sm dark:bg-slate-700',
                  r.consumed ? 'opacity-40' : '',
                ].join(' ')}
              >
                {RELIC_EMOJI[r.id]}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">
          {t('rpg.progress')}
        </h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {nodes.map((node, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <NodePill node={node} isCurrent={idx === currentNodeIndex} />
              {idx < nodes.length - 1 && (
                <span className="text-slate-400 dark:text-slate-600">→</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t('rpg.nextNode')}
            </div>
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {t(`rpg.nodeType.${currentNode.type}`)} —{' '}
              {t(`difficulty.${currentNode.difficulty}`)}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              {t(`mode.${currentNode.mode}`)}
            </div>
          </div>
          <span className="text-3xl">{NODE_EMOJI[currentNode.type]}</span>
        </div>
        <button
          type="button"
          onClick={onStartLevel}
          className="mt-2 rounded-2xl bg-slate-900 px-4 py-3 text-center text-white shadow-sm transition active:scale-[0.98] dark:bg-slate-100 dark:text-slate-900"
        >
          {t('rpg.startLevel')}
        </button>
      </section>
    </div>
  );
}
