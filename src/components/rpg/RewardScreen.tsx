/**
 * Obrazovka odměn po dokončení levelu. Hráč si vybere 1 ze 3 dropů.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { useTranslation } from 'react-i18next';
import type { RelicId, RewardOption } from '@/types/rpg';
import { POWER_UPS } from '@/game/rpg/powerUps';
import { useRunStore } from '@/store/runStore';

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
};

interface RewardCardProps {
  option: RewardOption;
  onPick: () => void;
}

function RewardCard({ option, onPick }: RewardCardProps) {
  const { t } = useTranslation();

  let icon = '';
  let title = '';
  let description = '';

  if (option.kind === 'gold') {
    icon = '💰';
    title = t('rpg.reward.goldTitle', { amount: option.amount });
    description = t('rpg.reward.goldDesc');
  } else if (option.kind === 'potion_hp') {
    icon = '❤️';
    title = t('rpg.reward.potionHpTitle', { amount: option.amount });
    description = t('rpg.reward.potionHpDesc');
  } else if (option.kind === 'power_up') {
    icon = POWER_UPS[option.powerUpId].icon;
    title = t(`rpg.powerUp.${option.powerUpId}.name`);
    description = t(`rpg.powerUp.${option.powerUpId}.desc`);
  } else {
    icon = RELIC_EMOJI[option.relicId] ?? '✨';
    title = t(`rpg.relic.${option.relicId}.name`);
    description = t(`rpg.relic.${option.relicId}.desc`);
  }

  return (
    <button
      type="button"
      onClick={onPick}
      className="flex flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-400 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-500"
    >
      <span className="text-3xl leading-none">{icon}</span>
      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </span>
      <span className="text-xs text-slate-600 dark:text-slate-400">
        {description}
      </span>
    </button>
  );
}

interface RewardScreenProps {
  onChosen: () => void;
}

export function RewardScreen({ onChosen }: RewardScreenProps) {
  const { t } = useTranslation();
  const run = useRunStore((s) => s.run);
  const chooseReward = useRunStore((s) => s.chooseReward);

  const rewards = run?.pendingRewards ?? null;
  if (!run || !rewards) return null;

  const handlePick = (index: number) => {
    chooseReward(index);
    onChosen();
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {t('rpg.reward.title')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t('rpg.reward.subtitle')}
        </p>
      </header>

      <div className="flex flex-col gap-2">
        {rewards.map((option, idx) => (
          <RewardCard
            key={idx}
            option={option}
            onPick={() => handlePick(idx)}
          />
        ))}
      </div>
    </div>
  );
}
