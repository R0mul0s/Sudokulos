# Coding Guidelines — Sudoku Game

> Závazná pravidla pro vývoj. Cíl: konzistentní, čitelný a udržitelný kód bez zbytečných překvapení.

---

## 1. Obecné principy

1. **Nejdřív se podívej, jestli už něco existuje.** Před psaním nové komponenty, utility nebo storu zkontroluj `src/components/`, `src/game/`, `src/hooks/`. Když to jde rozšířit nebo znovu použít, dej přednost tomu.
2. **Best practices dané technologie.** React idiomy, TS striktní typing, Tailwind utility-first.
3. **Jednoduchost před chytrostí.** Tři podobné řádky jsou lepší než předčasná abstrakce.
4. **Funkce dělá jednu věc.** Pokud funkce/komponenta přesahuje ~50 řádků nebo má více zodpovědností, rozděl ji.

---

## 2. Struktura projektu

```
src/
├── components/       React komponenty (PascalCase.tsx)
│   └── killer/       Komponenty specifické pro killer mód
├── game/             Čistá herní logika (žádný React)
│   ├── constants.ts
│   ├── validator.ts
│   ├── solver.ts
│   ├── generator.ts
│   └── killer/       Killer-specifická logika
├── hooks/            Vlastní React hooks (useXxx.ts)
├── i18n/             Překlady + setup
│   └── locales/
├── store/            Zustand stores (xxxStore.ts)
├── types/            Sdílené TypeScript typy
├── test/             Testovací setup
└── App.tsx, main.tsx, index.css
```

### Pravidla pro složky

- **`game/` nesmí importovat z Reactu, komponent ani storů.** Jde o čistou logiku — musí být testovatelná v Node bez DOM.
- **`components/` nesmí obsahovat herní algoritmy.** Pokud komponenta potřebuje logiku, volá ji z `game/`.
- **`store/` je jediný zdroj pravdy o stavu hry.** Komponenty nepoužívají lokální `useState` pro herní stav.
- **`hooks/` obsahuje reusable hooks** (např. `useKeyboardControls`, `useTimer`). Není to skladiště pro všechno.

---

## 3. Pojmenování

| Typ | Konvence | Příklad |
|---|---|---|
| Komponenty | PascalCase | `Board.tsx`, `NumberPad.tsx` |
| Hooks | `useXxx` | `useGameTimer.ts` |
| Stores | `xxxStore.ts` | `gameStore.ts` |
| Utility/logika | camelCase | `validator.ts`, `generator.ts` |
| Typy | PascalCase | `Cell`, `GameState`, `Difficulty` |
| Konstanty | UPPER_SNAKE_CASE | `BOARD_SIZE`, `MAX_MISTAKES` |
| Boolean | `is/has/can` prefix | `isPaused`, `hasError`, `canUndo` |
| Event handlery | `handleXxx` / prop `onXxx` | `handleCellClick` / `onCellClick` |

---

## 4. TypeScript

- **Striktní typing.** Žádné `any`. Když opravdu není jiná cesta, použij `unknown` a zúžuj přes type guards.
- **Preferuj `interface` pro objekty, `type` pro unie/aliasy/utility.**
- **Typy exportuj z `types/`**, pokud je používá víc modulů. Lokální typy nech v souboru.
- **`import type`** — používej pro typy, ať je build rychlejší a stromů-tříditelný (`verbatimModuleSyntax` je zapnuté).
  ```ts
  import type { Board, Cell } from '@/types/game';
  ```
- **Path alias `@/`** — vždy preferuj před relativními cestami (`../../game/solver`).
- **Žádné `!` non-null assertion**, pokud opravdu nevíš že to nemůže být null. Raději narrow přes `if`.

---

## 5. React

### Komponenty

- **Jen funkční komponenty.** Žádné class components.
- **Export named** (`export function Board()`), ne default. Snáze se refaktoruje a IDE najde použití.
  - Výjimka: `App.tsx` a page-level komponenty můžou být default.
- **Props typuj interfacem** pojmenovaným `XxxProps`.
  ```tsx
  interface CellProps {
    value: CellValue;
    isSelected: boolean;
    onClick: () => void;
  }

  export function Cell({ value, isSelected, onClick }: CellProps) { ... }
  ```
- **Žádné `React.FC`** — používej přímé typování parametrů.

### State

- **Herní stav** → Zustand store.
- **Efemérní UI stav** (hover, expand, formulářový input) → `useState`.
- **`useReducer`** pro komplexní lokální logiku s mnoha akcemi. Jinak `useState`.
- **Derived state** nikdy neukládej do state. Spočítej přímo v renderu, případně `useMemo` pokud je to drahé.

### Hooks

- **Stabilní závislosti.** Funkce v `useEffect` zavislostech musí být buď inline, memoizovaná (`useCallback`), nebo z Zustand selectoru.
- **Cleanup** v `useEffect`, pokud nastavuješ listener, timer, subscription.
- **Custom hook** = 2+ komponenty sdílí stejnou logiku, nebo komponenta má 3+ souvisejících hooks.

---

## 6. Styly — Tailwind

### Pravidla

1. **ŽÁDNÉ INLINE STYLY.** `style={{ ... }}` je zakázané. Jediná výjimka: dynamické hodnoty, které utility třídy nezvládnou (např. `style={{ transform: \`translateX(${x}px)\` }}` pro drag). I tam to ale 9× z 10 jde přes CSS custom property.
2. **Žádné `!important`**, ani přes `!` prefix v Tailwind třídách, pokud to není opravdu nutné.
3. **Theme tokens v `src/index.css`** — barvy, stíny, border radius definuj v `@theme`, ať jde měnit na jednom místě.
4. **Žádné magic numbers v třídách.** `p-[17px]` smrdí — použij škálu (`p-4`, `p-5`). Pokud potřebuješ konkrétní hodnotu, přidej ji do `@theme`.
5. **Dlouhé seznamy tříd rozděl přes `clsx`** nebo víc řádků, ať to jde přečíst.

### Doporučené vzory

- **Podmíněné třídy** přes `clsx` (v Tailwindu už nainstalovaný nebývá — pokud ho začneme používat, přidá se):
  ```tsx
  <div className={clsx(
    'rounded-lg p-4',
    isSelected && 'bg-cell-selected',
    hasError && 'bg-cell-error text-white',
  )} />
  ```
- **Responzivita mobile-first** — default styly jsou pro telefon, `sm:` / `md:` / `lg:` pro větší.
- **Dark mode** — přes `dark:` prefix, až přidáme tmavý režim.

### Globální styly

- `src/index.css` obsahuje `@import 'tailwindcss'`, `@theme` tokens a pár globálních resetů.
- **Žádné component-scoped CSS soubory** (žádné `Board.module.css`). Tailwind utility stačí.

---

## 7. i18n — žádné hardcoded stringy

1. **Všechny uživatelsky viditelné texty** musí jít přes `useTranslation`:
   ```tsx
   const { t } = useTranslation();
   return <button>{t('menu.newGame')}</button>;
   ```
2. **Překlady v `src/i18n/locales/{cs,en}.json`** — struktura zrcadlí obrazovku/komponentu:
   ```json
   {
     "game": {
       "timer": { "paused": "Pauza" }
     }
   }
   ```
3. **Oba jazyky musí být synchronní.** Když přidáš klíč do `cs.json`, ihned ho přidej i do `en.json` (i kdyby byl zatím stejný jako český).
4. **Čísla a data formátuj** přes `Intl.NumberFormat` / `Intl.DateTimeFormat` s jazykem z `i18n.language`.
5. **Pluralizace** přes i18next syntax (`{ "mistakes_one": "{{count}} chyba", "mistakes_few": "{{count}} chyby", "mistakes_other": "{{count}} chyb" }`).

---

## 8. State management — Zustand

- **Jeden store na doménu** (`gameStore`, `settingsStore`, `statsStore`). Ne jeden obří store.
- **Akce uvnitř storu** — komponenty volají `useGameStore((s) => s.selectCell)`, ne manipulují state zvenčí.
- **Selektory** vždy co nejužší, ať nepřerenderovávaš zbytečně:
  ```ts
  // ❌ rerender při každé změně
  const state = useGameStore();

  // ✅ rerender jen když se změní selected
  const selected = useGameStore((s) => s.selected);
  ```
- **Persistence** přes `zustand/middleware/persist` s explicitním `partialize` (neukládej vše, jen co má smysl).
- **Immer middleware** ano, pokud stav obsahuje hluboké immutable updaty.

---

## 9. Herní logika (`game/`)

- **Čistě funkční.** Žádný mutable globální stav, žádné side effecty.
- **Každá veřejná funkce má unit test.** Solver, generátor, validátor musí mít vysoké pokrytí.
- **Typové signatury napřed.** Napiš typ, pak implementuj.
- **Perfomance** — algoritmy na kritické cestě (solver, generator) mají mít benchmark (`vitest bench`), než se prohlásí za hotové.

---

## 10. Testy

- **Unit testy** pro `game/` — backtracking, validace, generování.
- **Component testy** (Testing Library) pro interakce — klik na buňku vybere, NumberPad vloží hodnotu, undo vrátí.
- **Žádné testy implementačních detailů.** Testuj chování, ne že se zavolal konkrétní hook.
- **Název testu popisuje chování:**
  ```ts
  it('odmítne vložit číslo, které porušuje pravidlo řádku', () => { ... });
  ```
- **AAA pattern** — Arrange, Act, Assert. Vizuálně oddělené prázdným řádkem.

---

## 11. Komentáře a dokumentace

- **Hlavička každého nového souboru** (viz globální CLAUDE.md):
  ```ts
  /**
   * Krátký popis co soubor dělá
   *
   * @author Roman Hlaváček
   * @created YYYY-MM-DD
   */
  ```
- **Každá veřejná funkce/metoda má JSDoc** s popisem, parametry a návratovou hodnotou:
  ```ts
  /**
   * Ověří, zda lze vložit hodnotu do buňky bez porušení pravidel sudoku.
   *
   * @param board Aktuální stav desky
   * @param row Řádek (0-8)
   * @param col Sloupec (0-8)
   * @param value Hodnota 1-9
   */
  export function canPlaceValue(board: Board, row: number, col: number, value: number): boolean { ... }
  ```
- **Interní komentáře** jen tam, kde logika není zjevná nebo je v ní záměrný trik/workaround.
- **Nepiš komentáře typu `// increment i`** — říkej PROČ, ne CO.

---

## 12. Konstanty a konfigurace

1. **ŽÁDNÉ MAGIC NUMBERS.** `9`, `81`, `3` v kódu jsou zakázané — patří do `game/constants.ts`.
2. **Konfigurace obtížnosti** (počet odebraných buněk, max čas, max chyby) do `game/difficulty.ts`.
3. **URL, API endpointy, klíče do localStorage** do samostatného souboru (`config/storage.ts`).

---

## 13. Čemu se vyhnout (antipatterns)

- ❌ **Inline styly** — patří do Tailwind tříd / theme tokens
- ❌ **Hardcoded texty** — vše přes i18n
- ❌ **Magic numbers** — vše do konstant
- ❌ **`any`** — vždy existuje lepší typ
- ❌ **Default export** u komponent (kromě `App`) — named export
- ❌ **Mutace props** — props jsou readonly
- ❌ **Přímá mutace Zustand state** zvenčí store
- ❌ **Promíchání game logiky a React kódu** v jednom souboru
- ❌ **Globální `window.*` proměnné** — použij store
- ❌ **Nested ternary operátory** hlubší než 1 úroveň — rozděl na `if/else` nebo early return
- ❌ **Komentáře, které říkají co kód dělá** místo proč
- ❌ **`console.log` v commitech** — ESLint to zachytí, stejně odstraň
- ❌ **Disable ESLint/TS errorů bez odůvodnění** — když musíš, tak s komentářem PROČ
- ❌ **Commit s nesouvisejícími změnami** — každý commit = jedna logická změna

---

## 14. Git a commity

- Commity **podrobně** — co se změnilo a PROČ (viz globální CLAUDE.md).
- Formát: krátký nadpis (max 70 znaků), prázdný řádek, detailní tělo pokud třeba.
- **Žádné `fix` / `update` / `wip`** commity v `main` — squashni nebo přejmenuj.
- Branch naming: `feat/killer-sudoku`, `fix/solver-backtrack`, `refactor/split-board`.

---

## 15. Performance checklist před mergem

- [ ] `npm run build` projde bez warningů
- [ ] `npm run test:run` zelené
- [ ] `npm run format:check` zelené
- [ ] `npm run lint` bez chyb
- [ ] Nové komponenty mají přístupnost (aria-* tam, kde je potřeba)
- [ ] Nové texty jsou v obou jazycích (cs + en)
- [ ] Bundle size — kontrola, že nenarost o >20 kB gzipped bez důvodu

---

## 16. Když si nejsi jistý

1. Podívej se, jak je to jinde v projektu.
2. Když je to nové téma, dohodni se předem na přístupu — nestavěj 500 řádků "naslepo".
3. Raději otevři issue/PR s otázkou než udělej předpoklad.
