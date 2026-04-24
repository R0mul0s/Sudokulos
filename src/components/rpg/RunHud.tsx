/**
 * HUD overlay v GameScreen pro aktivní RPG run — HP, gold, combo, relics,
 * postup v runu.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { useTranslation } from 'react-i18next';
import type { RelicId } from '@/types/rpg';
import { useRunStore } from '@/store/runStore';

const RELIC_EMOJI: Record<RelicId, string> = {
  amulet_of_insight: '🔮',
  copper_ring: '💍',
  leather_glove: '🧤',
  dragon_scale: '🛡️',
  phoenix: '🦅',
};

function HeartRow({ hp, maxHp }: { hp: number; maxHp: number }) {
  const hearts: string[] = [];
  for (let i = 0; i < maxHp; i++) hearts.push(i < hp ? '❤️' : '🤍');
  return (
    <span
      className="text-base leading-none tracking-tight"
      aria-label={`${hp} / ${maxHp} HP`}
    >
      {hearts.join('')}
    </span>
  );
}

export function RunHud() {
  const { t } = useTranslation();
  const run = useRunStore((s) => s.run);
  if (!run) return null;

  const { player, currentNodeIndex, nodes } = run;
  const currentNode = nodes[currentNodeIndex];

  return (
    <div className="flex w-full flex-col gap-2 rounded-2xl bg-slate-100 p-3 shadow-sm dark:bg-slate-800">
      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
        <span className="uppercase tracking-wide">
          {t('rpg.levelLabel', {
            current: currentNodeIndex + 1,
            total: nodes.length,
          })}
        </span>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold dark:bg-slate-700">
          {t(`rpg.nodeType.${currentNode.type}`)}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <HeartRow hp={player.hp} maxHp={player.maxHp} />
        <div className="flex items-center gap-3 text-sm font-medium text-slate-900 dark:text-slate-100">
          <span className="flex items-center gap-1">
            💰 <span className="tabular-nums">{player.gold}</span>
          </span>
          {player.combo >= 2 && (
            <span className="flex items-center gap-1 rounded-full bg-amber-200 px-2 py-0.5 text-amber-900 dark:bg-amber-500/30 dark:text-amber-200">
              🔥 ×{player.combo}
            </span>
          )}
        </div>
      </div>

      {player.relics.length > 0 && (
        <div className="flex flex-wrap gap-1" aria-label={t('rpg.relicsLabel')}>
          {player.relics.map((r) => (
            <span
              key={r.id}
              title={t(`rpg.relic.${r.id}.name`)}
              className={[
                'rounded-lg bg-white px-2 py-1 text-sm shadow-sm dark:bg-slate-700',
                r.consumed ? 'opacity-30' : '',
              ].join(' ')}
            >
              {RELIC_EMOJI[r.id]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
