/**
 * Obrazovka obchodu — hráč utratí gold za relics, lektvary nebo power-up scrolls.
 *
 * @author Roman Hlaváček
 * @created 2026-04-25
 */
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { RelicId, ShopItem } from '@/types/rpg';
import { POWER_UPS } from '@/game/rpg/powerUps';
import { useRunStore } from '@/store/runStore';

interface ShopScreenProps {
  onLeft: () => void;
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

interface ItemPresentation {
  icon: string;
  title: string;
  description: string;
}

function describeItem(
  item: ShopItem,
  t: (key: string, opts?: Record<string, unknown>) => string,
): ItemPresentation {
  if (item.kind === 'relic') {
    return {
      icon: RELIC_EMOJI[item.relicId] ?? '✨',
      title: t(`rpg.relic.${item.relicId}.name`),
      description: t(`rpg.relic.${item.relicId}.desc`),
    };
  }
  if (item.kind === 'potion_hp') {
    return {
      icon: '❤️',
      title: t('rpg.shop.potionHpTitle'),
      description: t('rpg.shop.potionHpDesc'),
    };
  }
  return {
    icon: POWER_UPS[item.powerUpId].icon,
    title: t(`rpg.powerUp.${item.powerUpId}.name`),
    description: t(`rpg.powerUp.${item.powerUpId}.desc`),
  };
}

export function ShopScreen({ onLeft }: ShopScreenProps) {
  const { t } = useTranslation();
  const offer = useRunStore((s) => s.levelState.shopOffer);
  const gold = useRunStore((s) => s.run?.player.gold ?? 0);
  const enterShopNode = useRunStore((s) => s.enterShopNode);
  const purchaseShopItem = useRunStore((s) => s.purchaseShopItem);
  const leaveShopNode = useRunStore((s) => s.leaveShopNode);

  useEffect(() => {
    if (!offer) enterShopNode();
  }, [offer, enterShopNode]);

  if (!offer) return null;

  const handleBuy = (idx: number) => {
    purchaseShopItem(idx);
  };

  const handleLeave = () => {
    leaveShopNode();
    onLeft();
  };

  return (
    <div className="flex w-full flex-col gap-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            🏪 {t('rpg.shop.title')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t('rpg.shop.subtitle')}
          </p>
        </div>
        <span className="rounded-full bg-amber-200 px-3 py-1 text-sm font-semibold text-amber-900 dark:bg-amber-500/30 dark:text-amber-200">
          💰 {gold}
        </span>
      </header>

      <div className="flex flex-col gap-2">
        {offer.length === 0 && (
          <p className="text-sm italic text-slate-500 dark:text-slate-400">
            {t('rpg.shop.empty')}
          </p>
        )}
        {offer.map((item, idx) => {
          const copy = describeItem(item, t);
          const canAfford = gold >= item.price;
          return (
            <button
              key={`${item.kind}-${idx}`}
              type="button"
              onClick={() => handleBuy(idx)}
              disabled={!canAfford}
              className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-white p-4 text-left shadow-sm transition active:scale-[0.99] disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800"
            >
              <span className="text-3xl">{copy.icon}</span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {copy.title}
                </span>
                <span className="block text-xs text-slate-600 dark:text-slate-400">
                  {copy.description}
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
                💰 {item.price}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleLeave}
        className="rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-sm transition active:scale-[0.98] dark:bg-slate-100 dark:text-slate-900"
      >
        {t('rpg.shop.leave')}
      </button>
    </div>
  );
}
