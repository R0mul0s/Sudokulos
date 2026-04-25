/**
 * Obrazovka mystery uzlu — náhodná událost (Oltář / Odpočinek / Truhla),
 * hráč ji může přijmout nebo přeskočit.
 *
 * @author Roman Hlaváček
 * @created 2026-04-25
 */
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { MysteryEvent } from '@/types/rpg';
import { POWER_UPS } from '@/game/rpg/powerUps';
import { useRunStore } from '@/store/runStore';

interface MysteryScreenProps {
  onResolved: () => void;
}

interface EventCopy {
  icon: string;
  title: string;
  description: string;
  acceptLabel: string;
  acceptDisabled: boolean;
}

function describeEvent(
  event: MysteryEvent,
  t: (key: string, opts?: Record<string, unknown>) => string,
  hp: number,
): EventCopy {
  switch (event.kind) {
    case 'altar':
      return {
        icon: '🩸',
        title: t('rpg.mystery.altar.title'),
        description: t('rpg.mystery.altar.desc', {
          relic: t(`rpg.relic.${event.relicId}.name`),
          hp: event.hpCost,
        }),
        acceptLabel: t('rpg.mystery.altar.accept'),
        acceptDisabled: hp <= event.hpCost,
      };
    case 'rest':
      return {
        icon: '🛏️',
        title: t('rpg.mystery.rest.title'),
        description: t('rpg.mystery.rest.desc', { hp: event.hpHeal }),
        acceptLabel: t('rpg.mystery.rest.accept'),
        acceptDisabled: false,
      };
    case 'chest_gold':
      return {
        icon: '🪙',
        title: t('rpg.mystery.chestGold.title'),
        description: t('rpg.mystery.chestGold.desc', {
          amount: event.amount,
        }),
        acceptLabel: t('rpg.mystery.chestGold.accept'),
        acceptDisabled: false,
      };
    case 'chest_scroll':
      return {
        icon: POWER_UPS[event.powerUpId].icon,
        title: t('rpg.mystery.chestScroll.title'),
        description: t('rpg.mystery.chestScroll.desc', {
          name: t(`rpg.powerUp.${event.powerUpId}.name`),
        }),
        acceptLabel: t('rpg.mystery.chestScroll.accept'),
        acceptDisabled: false,
      };
  }
}

export function MysteryScreen({ onResolved }: MysteryScreenProps) {
  const { t } = useTranslation();
  const event = useRunStore((s) => s.levelState.pendingMystery);
  const hp = useRunStore((s) => s.run?.player.hp ?? 0);
  const enterMysteryNode = useRunStore((s) => s.enterMysteryNode);
  const resolveMysteryNode = useRunStore((s) => s.resolveMysteryNode);

  // Pokud ještě není událost vygenerovaná, vygenerovat při prvním renderu.
  useEffect(() => {
    if (!event) enterMysteryNode();
  }, [event, enterMysteryNode]);

  if (!event) return null;

  const copy = describeEvent(event, t, hp);

  const handle = (accept: boolean) => {
    resolveMysteryNode(accept);
    onResolved();
  };

  return (
    <div className="flex w-full flex-col gap-5">
      <header className="flex flex-col items-center gap-2 text-center">
        <span className="text-5xl">{copy.icon}</span>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {copy.title}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {copy.description}
        </p>
      </header>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => handle(true)}
          disabled={copy.acceptDisabled}
          className="rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-sm transition active:scale-[0.98] disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900"
        >
          {copy.acceptLabel}
        </button>
        <button
          type="button"
          onClick={() => handle(false)}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm transition active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          {t('rpg.mystery.skip')}
        </button>
      </div>
    </div>
  );
}
