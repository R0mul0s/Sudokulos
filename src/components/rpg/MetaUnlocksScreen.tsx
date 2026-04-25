/**
 * Meta progression — utrať nasbírané souls za odemčení dalších tříd
 * a rare relics, které se přidají do dropping poolu.
 *
 * @author Roman Hlaváček
 * @created 2026-04-25
 */
import { useTranslation } from 'react-i18next';
import type { RelicId } from '@/types/rpg';
import { RELIC_UNLOCK_COSTS } from '@/game/rpg/relics';
import {
  CLASS_UNLOCK_COSTS,
  useProfileStore,
} from '@/store/profileStore';
import { AVAILABLE_CLASSES } from '@/store/runStore';

interface MetaUnlocksScreenProps {
  onClose: () => void;
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

export function MetaUnlocksScreen({ onClose }: MetaUnlocksScreenProps) {
  const { t } = useTranslation();
  const profile = useProfileStore((s) => s.profile);
  const unlockClass = useProfileStore((s) => s.unlockClass);
  const unlockRelic = useProfileStore((s) => s.unlockRelic);

  const lockedClasses = AVAILABLE_CLASSES.filter(
    (cls) => !profile.unlockedClasses.includes(cls),
  );
  const lockedRelics = (Object.keys(RELIC_UNLOCK_COSTS) as RelicId[]).filter(
    (id) => !profile.unlockedRelics.includes(id),
  );

  return (
    <div className="flex w-full flex-col gap-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            🪙 {t('meta.title')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t('meta.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white dark:bg-slate-100 dark:text-slate-900"
        >
          {t('meta.close')}
        </button>
      </header>

      <div className="flex items-center justify-between rounded-2xl bg-amber-100 px-4 py-3 dark:bg-amber-500/20">
        <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
          {t('meta.balance')}
        </span>
        <span className="text-xl font-bold text-amber-900 dark:text-amber-100">
          🪙 {profile.souls}
        </span>
      </div>

      {lockedClasses.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">
            {t('meta.classesSection')}
          </h2>
          {lockedClasses.map((cls) => {
            const cost = CLASS_UNLOCK_COSTS[cls];
            const canAfford = profile.souls >= cost;
            return (
              <UnlockButton
                key={cls}
                icon={t(`rpg.class.${cls}.icon`)}
                title={t(`rpg.class.${cls}.name`)}
                description={t(`rpg.class.${cls}.desc`)}
                cost={cost}
                canAfford={canAfford}
                onClick={() => unlockClass(cls)}
              />
            );
          })}
        </section>
      )}

      {lockedRelics.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">
            {t('meta.relicsSection')}
          </h2>
          {lockedRelics.map((id) => {
            const cost = RELIC_UNLOCK_COSTS[id] ?? 0;
            const canAfford = profile.souls >= cost;
            return (
              <UnlockButton
                key={id}
                icon={RELIC_EMOJI[id]}
                title={t(`rpg.relic.${id}.name`)}
                description={t(`rpg.relic.${id}.desc`)}
                cost={cost}
                canAfford={canAfford}
                onClick={() => unlockRelic(id)}
              />
            );
          })}
        </section>
      )}

      {lockedClasses.length === 0 && lockedRelics.length === 0 && (
        <p className="text-center text-sm italic text-slate-500 dark:text-slate-400">
          {t('meta.allUnlocked')}
        </p>
      )}
    </div>
  );
}

interface UnlockButtonProps {
  icon: string;
  title: string;
  description: string;
  cost: number;
  canAfford: boolean;
  onClick: () => void;
}

function UnlockButton({
  icon,
  title,
  description,
  cost,
  canAfford,
  onClick,
}: UnlockButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canAfford}
      className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-white p-4 text-left shadow-sm transition active:scale-[0.99] disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800"
    >
      <span className="text-3xl">{icon}</span>
      <span className="flex-1">
        <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </span>
        <span className="block text-xs text-slate-600 dark:text-slate-400">
          {description}
        </span>
      </span>
      <span
        className={[
          'rounded-full px-2 py-1 text-xs font-semibold',
          canAfford
            ? 'bg-amber-200 text-amber-900 dark:bg-amber-500/30 dark:text-amber-200'
            : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
        ].join(' ')}
      >
        🪙 {cost}
      </span>
    </button>
  );
}
