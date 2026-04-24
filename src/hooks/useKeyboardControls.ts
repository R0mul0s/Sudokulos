/**
 * Klávesové ovládání hry — šipky, čísla 1-9, Backspace/Delete pro mazání,
 * N pro přepnutí poznámkového módu, P pro pauzu, Ctrl/Cmd+Z pro undo.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';

export function useKeyboardControls(): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const store = useGameStore.getState();
      if (store.status !== 'playing' && store.status !== 'paused') return;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        store.undo();
        return;
      }

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          store.moveSelection(-1, 0);
          return;
        case 'ArrowDown':
          event.preventDefault();
          store.moveSelection(1, 0);
          return;
        case 'ArrowLeft':
          event.preventDefault();
          store.moveSelection(0, -1);
          return;
        case 'ArrowRight':
          event.preventDefault();
          store.moveSelection(0, 1);
          return;
        case 'Backspace':
        case 'Delete':
        case '0':
          event.preventDefault();
          store.erase();
          return;
        case 'n':
        case 'N':
          event.preventDefault();
          store.toggleNoteMode();
          return;
        case 'p':
        case 'P':
          event.preventDefault();
          if (store.status === 'playing') store.pause();
          else store.resume();
          return;
      }

      if (event.key >= '1' && event.key <= '9') {
        event.preventDefault();
        store.handleInput(Number(event.key));
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
