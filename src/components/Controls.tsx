/**
 * Ovládací tlačítka pod deskou — undo, smazat, poznámkový mód, hint, pauza.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/store/gameStore';

interface ControlButtonProps {
  label: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  badge?: string | number;
}

function ControlButton({
  label,
  icon,
  onClick,
  disabled,
  active,
  badge,
}: ControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'flex flex-1 flex-col items-center justify-center gap-1 rounded-xl',
        'px-2 py-2 text-xs font-medium shadow-sm transition',
        'active:scale-95 disabled:opacity-40',
        active
          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
          : 'bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
      ].join(' ')}
      aria-label={label}
      aria-pressed={active}
    >
      <span className="relative text-xl">
        {icon}
        {badge !== undefined && (
          <span
            className={[
              'absolute -right-3 -top-1 rounded-full px-1 text-[10px]',
              active
                ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white'
                : 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900',
            ].join(' ')}
          >
            {badge}
          </span>
        )}
      </span>
      <span>{label}</span>
    </button>
  );
}

export function Controls() {
  const { t } = useTranslation();
  const status = useGameStore((s) => s.status);
  const noteMode = useGameStore((s) => s.noteMode);
  const historyLength = useGameStore((s) => s.history.length);
  const hintsUsed = useGameStore((s) => s.hintsUsed);
  const undo = useGameStore((s) => s.undo);
  const erase = useGameStore((s) => s.erase);
  const toggleNoteMode = useGameStore((s) => s.toggleNoteMode);
  const useHint = useGameStore((s) => s.useHint);
  const pause = useGameStore((s) => s.pause);
  const resume = useGameStore((s) => s.resume);

  const playing = status === 'playing';

  return (
    <div className="flex w-full gap-2" role="toolbar">
      <ControlButton
        label={t('game.undo')}
        icon="↶"
        onClick={undo}
        disabled={historyLength === 0 || !playing}
      />
      <ControlButton
        label={t('game.erase')}
        icon="⌫"
        onClick={erase}
        disabled={!playing}
      />
      <ControlButton
        label={t('game.notes')}
        icon="✎"
        onClick={toggleNoteMode}
        active={noteMode}
        disabled={!playing}
      />
      <ControlButton
        label={t('game.hint')}
        icon="💡"
        onClick={useHint}
        disabled={!playing}
        badge={hintsUsed > 0 ? hintsUsed : undefined}
      />
      <ControlButton
        label={status === 'paused' ? t('game.resume') : t('game.pause')}
        icon={status === 'paused' ? '▶' : '⏸'}
        onClick={status === 'paused' ? resume : pause}
        disabled={status !== 'playing' && status !== 'paused'}
      />
    </div>
  );
}
