/**
 * HUD overlay v GameScreen pro aktivní RPG run — HP, gold, combo, relics,
 * postup v runu.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { useTranslation } from 'react-i18next';
import type { EnvEffect, RelicId } from '@/types/rpg';
import { useRunStore } from '@/store/runStore';
import { triggerHaptic } from '@/game/haptics';
import { PowerUpButton } from './PowerUpButton';

const ENV_EFFECT_EMOJI: Record<EnvEffect, string> = {
  storm: '🌩️',
  light: '☀️',
  frost: '❄️',
  dark: '🌑',
};

function BloodAltarButton() {
  const { t } = useTranslation();
  const hp = useRunStore((s) => s.run?.player.hp ?? 0);
  const activate = useRunStore((s) => s.activateBloodAltar);
  const disabled = hp <= 1;
  return (
    <button
      type="button"
      onClick={() => {
        if (activate()) triggerHaptic('error');
      }}
      disabled={disabled}
      className={[
        'flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold shadow-sm transition active:scale-95',
        disabled
          ? 'bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
          : 'bg-red-300 text-red-900 hover:bg-red-400 dark:bg-red-500/30 dark:text-red-100',
      ].join(' ')}
      title={t('rpg.relic.blood_altar.desc')}
      aria-label={t('rpg.bloodAltar.action')}
    >
      🩸 −1 HP / +50 💰
    </button>
  );
}

const RELIC_EMOJI: Record<RelicId, string> = {
  amulet_of_insight: '🔮',
  copper_ring: '💍',
  leather_glove: '🧤',
  dragon_scale: '🛡️',
  phoenix: '🦅',
  silver_chain: '⛓️',
  mana_vial: '🧪',
  flame_crown: '👑',
  spell_book: '📖',
  sharp_eye: '👁️',
  stone_totem: '🪨',
  shadow: '👤',
  blood_altar: '🩸',
  golden_pact: '💰',
  time_dilation: '⏳',
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
        <span className="flex items-center gap-1">
          {currentNode.envEffect && (
            <span
              className="rounded-full bg-indigo-200 px-2 py-0.5 text-[10px] font-semibold text-indigo-900 dark:bg-indigo-500/30 dark:text-indigo-100"
              title={t(`rpg.envEffect.${currentNode.envEffect}.desc`)}
            >
              {ENV_EFFECT_EMOJI[currentNode.envEffect]}{' '}
              {t(`rpg.envEffect.${currentNode.envEffect}.name`)}
            </span>
          )}
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold dark:bg-slate-700">
            {t(`rpg.nodeType.${currentNode.type}`)}
          </span>
        </span>
      </div>

      <div className="flex items-center justify-between">
        <HeartRow hp={player.hp} maxHp={player.maxHp} />
        <div className="flex items-center gap-3 text-sm font-medium text-slate-900 dark:text-slate-100">
          <span className="flex items-center gap-1">
            💰 <span className="tabular-nums">{player.gold}</span>
          </span>
          {player.maxMana > 0 && (
            <span className="flex items-center gap-1">
              🔵{' '}
              <span className="tabular-nums">
                {player.mana}/{player.maxMana}
              </span>
            </span>
          )}
          {player.combo >= 2 && (
            <span
              key={player.combo}
              className="animate-combo-pop flex items-center gap-1 rounded-full bg-amber-200 px-2 py-0.5 text-amber-900 dark:bg-amber-500/30 dark:text-amber-200"
            >
              🔥 ×{player.combo}
            </span>
          )}
        </div>
      </div>

      {(player.powerUp ||
        player.relics.some(
          (r) => r.id === 'blood_altar' && !r.consumed,
        )) && (
        <div className="flex flex-wrap justify-end gap-2">
          {player.powerUp && <PowerUpButton />}
          {player.relics.some(
            (r) => r.id === 'blood_altar' && !r.consumed,
          ) && <BloodAltarButton />}
        </div>
      )}

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
