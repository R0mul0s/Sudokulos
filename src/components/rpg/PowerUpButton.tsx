/**
 * Tlačítko v RunHud, které aktivuje aktuální power-up. Pro Peek vyžaduje
 * vybranou buňku a předá správnou hodnotu ze solution; pro Shield jen
 * aktivuje flag pro příští mistake.
 *
 * @author Roman Hlaváček
 * @created 2026-04-25
 */
import { useTranslation } from 'react-i18next';
import { POWER_UPS } from '@/game/rpg/powerUps';
import { useGameStore } from '@/store/gameStore';
import { useRunStore } from '@/store/runStore';
import { triggerHaptic } from '@/game/haptics';

export function PowerUpButton() {
  const { t } = useTranslation();
  const powerUp = useRunStore((s) => s.run?.player.powerUp ?? null);
  const shieldActive = useRunStore((s) => s.levelState.shieldActive);
  const activatePeek = useRunStore((s) => s.activatePeek);
  const activateShield = useRunStore((s) => s.activateShield);
  const selected = useGameStore((s) => s.selected);
  const board = useGameStore((s) => s.board);
  const solution = useGameStore((s) => s.solution);

  if (!powerUp) return null;

  const definition = POWER_UPS[powerUp.id];
  const peekDisabled =
    powerUp.id === 'peek' &&
    (!selected ||
      !board ||
      !solution ||
      board[selected.row][selected.col].value !== 0);
  const shieldDisabled = powerUp.id === 'shield' && shieldActive;
  const disabled = peekDisabled || shieldDisabled;

  const handleClick = () => {
    if (!powerUp || disabled) return;
    if (powerUp.id === 'peek' && selected && solution) {
      const ok = activatePeek(
        selected.row,
        selected.col,
        solution[selected.row][selected.col],
      );
      if (ok) triggerHaptic('tap');
      return;
    }
    if (powerUp.id === 'shield') {
      const ok = activateShield();
      if (ok) triggerHaptic('tap');
      return;
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={[
        'flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold shadow-sm transition active:scale-95',
        disabled
          ? 'bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
          : 'bg-amber-300 text-amber-900 hover:bg-amber-400 dark:bg-amber-500/30 dark:text-amber-100',
      ].join(' ')}
      aria-label={t(`rpg.powerUp.${powerUp.id}.name`)}
      title={t(`rpg.powerUp.${powerUp.id}.desc`)}
    >
      <span>{definition.icon}</span>
      <span>{t(`rpg.powerUp.${powerUp.id}.name`)}</span>
      {powerUp.charges > 1 && (
        <span className="rounded-full bg-amber-100 px-1.5 text-xs text-amber-900 dark:bg-amber-200/40">
          ×{powerUp.charges}
        </span>
      )}
      {shieldActive && powerUp.id === 'shield' && (
        <span className="text-xs uppercase">
          {t('rpg.powerUp.shield.activeTag')}
        </span>
      )}
    </button>
  );
}
