# Roadmap — Sudoku Game

> Plán vývoje rozdělený do fází. Každá fáze je samostatně dodatelný celek, na konci je app v použitelném stavu.

**Legenda:** ✅ hotovo · 🚧 rozpracováno · ⏳ plánováno

---

## Fáze 0 — Setup projektu ✅

Základy už stojí.

- ✅ Vite 7 + React 19 + TypeScript
- ✅ Tailwind CSS v4 s theme tokens
- ✅ i18n (cs/en) přes react-i18next + detektor jazyka
- ✅ PWA plugin (manifest, service worker, offline cache)
- ✅ Vitest + Testing Library
- ✅ Prettier + ESLint
- ✅ Struktura složek (`components/`, `game/`, `store/`, `i18n/`, `types/`)

---

## Fáze 1 — Herní logika klasiky ✅

Čistá logika bez UI — pokrytá unit testy, nezávislá na Reactu.

- ✅ `game/validator.ts` — validace řádku/sloupce/bloku, detekce konfliktů
- ✅ `game/solver.ts` — backtracking s MRV heuristikou + bitmasky, `countSolutions` pro ověření unikátnosti
- ✅ `game/generator.ts` — generátor zadání podle obtížnosti (easy/medium/hard/expert)
- ✅ `game/notes.ts` — `getPossibleValues` + `computeAutoNotes`
- ✅ `game/rng.ts` — seedable mulberry32 RNG pro deterministické testy
- ✅ `game/grid.ts` — parseGrid/formatGrid/cloneGrid utility
- ✅ `game/difficulty.ts` — konfigurace min/max zadaných buněk pro každou obtížnost
- ✅ 63 unit testů, běh <2 s

**DoD splněno:** `npm run test:run` zelené, solver řeší 20 náhodných puzzle v průměru pod 500 ms, generátor vytváří všechny obtížnosti pod 2 s s garantovanou unikátností řešení.

---

## Fáze 2 — UI klasické hry ✅

První hratelná verze.

- ✅ `store/gameStore.ts` (Zustand) — stav hry, výběr buňky, vložení hodnoty, poznámky, undo
- ✅ `components/Board.tsx` — 9×9 mřížka s blokem oddělovači, peer highlight, same-value highlight
- ✅ `components/Cell.tsx` — buňka (given/user/error states, 3×3 poznámky, zvýraznění)
- ✅ `components/NumberPad.tsx` — 1–9 tlačítka, disabled když je hodnota plně použitá
- ✅ `components/Controls.tsx` — undo, erase, notes toggle, pause
- ✅ `components/Timer.tsx` — mm:ss formát, počítadlo chyb
- ✅ `components/DifficultyPicker.tsx` — výběr před novou hrou + loading indikace
- ✅ `components/GameScreen.tsx` — integrace (pauza overlay, obrazovka dokončení)
- ✅ `hooks/useGameTimer.ts` — rAF smyčka napojená na tick
- ✅ `hooks/useKeyboardControls.ts` — šipky, čísla, Backspace, N (notes), P (pause), Ctrl+Z (undo)
- ✅ Touch UX — `aspect-square` buňky, viewport-fit + user-scalable=no v index.html
- ✅ 17 unit testů pro gameStore (celkem 80 testů, <2 s)

**DoD splněno:** lze odehrát partii, dokončení se detekuje (přepne status na 'completed'), čas i chyby se počítají. Undo vrací i auto-smazané poznámky u peerů.

**Co chybí / zůstalo na Fázi 3:**
- Hint (nápověda) — v Controls zatím není (čeká na rozhodnutí, jak má fungovat — cílená buňka × obecná nápověda)
- Omezení maximálního počtu chyb (3-strikes)
- Persistence rozehrané hry

---

## Fáze 3 — Game flow a persistence ✅

- ✅ `store/settingsStore.ts` — maxMistakes, highlightSameDigits, autoRemoveNotes (persist)
- ✅ Obrazovky: `MenuScreen` (s Continue), `GameScreen`, `SettingsScreen` + pauza/completed/failed overlay
- ✅ Perzistence rozehrané hry do `localStorage` přes Zustand persist middleware
  - Set<number> v poznámkách se serializuje jako Array<number>
  - Při rehydrate se status 'playing'/'paused' vrací jako 'menu' (uživatel se sám rozhodne Continue)
- ✅ Obrazovka "hotovo" / "prohra" s časem, obtížností, počtem chyb, počtem hintů
- ✅ Omezení počtu chyb (0 = bez limitu / 3 / 5), při dosažení stav `failed`
- ✅ Nastavení obtížnosti limitu chyb, vizuálních preferencí a automatických poznámek
- ✅ Hint: vyřeší jednu prázdnou buňku (preferuje selected), +30 s penalizace, počítá se hintsUsed
- ✅ Jazyk: přepínač je v menu header (už z Fáze 0), persistence jazyka řeší i18next-browser-languagedetector

**DoD splněno:** rozehraná hra přežije zavření prohlížeče (board + čas + chyby), flow menu→hra→pauza→dokončení/prohra funguje, settings se ukládají. 91 testů, build 88 kB gzipped.

**Vědomě odloženo:** zvuky, tmavý režim, haptická odezva — posunuto do Fáze 5 (polish).

---

## Fáze 4 — PWA polish a deploy 🚧

Kódová část hotová, deploy je na uživateli.

- ✅ Ikona: [public/icon.svg](../public/icon.svg) (tmavé pozadí, 3×3 mřížka s čísly)
- ✅ Generátor PNG ikon: [scripts/generate-icons.mjs](../scripts/generate-icons.mjs) (`npm run icons`)
  - Produkuje favicon-16/32, apple-touch-icon, pwa-192/512, pwa-maskable-512
- ✅ Manifest rozšířen: lang, scope, description, všechny ikony
- ✅ index.html — favicon SVG + PNG fallback, apple-touch-icon, theme-color, meta description
- ✅ Install prompt: [src/hooks/useInstallPrompt.ts](../src/hooks/useInstallPrompt.ts) + `InstallBanner` v menu
  - Poslouchá `beforeinstallprompt`, zobrazuje banner jen když browser podporuje a app není nainstalovaná
- ✅ Offline: `vite-plugin-pwa` generuje SW s `generateSW` strategií, precache 21 entries (324 KB)
- ✅ README + [docs/DEPLOY.md](DEPLOY.md) s postupem pro GitHub + Vercel

**Hotovo:**
- ✅ Repo `R0mul0s/Sudokulos` na GitHubu
- ✅ Nasazeno na Vercelu, safe-area insets fungují na telefonu

---

## Fáze 5 — Statistiky a polish ✅

- ✅ `store/statsStore.ts` — historie her (persist, max 500), agregáty (per-obtížnost: played/completed/bestTime/averageTime, overall success rate, streak)
- ✅ `StatsScreen` — overall metriky, per-obtížnost, streak s lokálním datem, clear historie
- ✅ Tmavý režim: CSS tokens s přepínáním přes `.dark` class, `useThemeSync` hook se sledováním `prefers-color-scheme`, settings picker system/light/dark
- ✅ Všechny komponenty mají `dark:` varianty (Board, Cell, NumberPad, Controls, Timer, MenuScreen, SettingsScreen, StatsScreen, GameScreen, LanguageSwitcher, InstallBanner)
- ✅ Haptická odezva: `game/haptics.ts` přes Vibration API, 4 patterny (tap/error/success/fail), respektuje `hapticsEnabled` setting
- ✅ Animace: `animate-fade-in` pro pauza overlay, `animate-overlay-in` (scale+fade) pro completed/failed dialog
- ✅ gameStore zaznamenává každou dohranou hru do stats (completed/failed)
- ✅ 110 testů, build 90.5 kB gzipped

**Vědomě odloženo:** zvuky (Web Audio / assety) — nechány na později, bez zvuků app působí čistě.

**DoD splněno:** app má statistiky, respektuje systémový motiv i ruční přepínač, vibruje při chybách a dokončení, overlay se objevuje s animací.

---

## Fáze 6 — Killer Sudoku ⏳

Samostatná fáze, protože přidává vlastní doménu (klece, součty).

### 6.1 Datový model

- [ ] Rozšířit `types/game.ts` o `Cage` (buňky + cílový součet) a `GameMode = 'classic' | 'killer'`
- [ ] `types/killer.ts` — killer-specifické typy, validační pravidla

### 6.2 Logika

- [ ] `game/killer/validator.ts` — validace součtu klece + pravidlo unikátnosti čísel v kleci
- [ ] `game/killer/generator.ts` — generátor klecí nad plným řešením
  - Algoritmus: pokryj mřížku klecemi velikosti 1–5 (laděno obtížností), zachovat uniqueness
- [ ] `game/killer/solver.ts` — rozšíření solveru o omezení součtů (constraint propagation)

### 6.3 UI

- [ ] `components/killer/CageOverlay.tsx` — přerušované ohraničení klecí přes mřížku
- [ ] `components/killer/CageSum.tsx` — štítek se součtem v levém horním rohu klece
- [ ] Rozšíření `Cell.tsx` o klec awareness (nezobrazovat duplicitní čísla v kleci)

### 6.4 Integrace

- [ ] `DifficultyPicker` rozšířit o výběr módu (klasika / killer)
- [ ] i18n překlady pro killer
- [ ] Perzistence killer rozehrané hry
- [ ] Statistiky killer zvlášť

**DoD:** killer sudoku hratelné ve všech obtížnostech, generátor vytváří validní zadání, UI zřetelně odlišuje klece.

---

## Fáze 7 — Nice-to-have ⏳

Nápady, které se vyhodnotí až po dokončení 0–6.

- [ ] Denní výzva (stejné zadání pro všechny, sdílené přes seed)
- [ ] Leaderboard (lokální nebo cloudový — pravděpodobně Supabase/Firebase free tier)
- [ ] Export/import her do PDF/obrázku
- [ ] Tutoriál pro killer sudoku (vysvětlení klecí)
- [ ] Další módy: *Samurai*, *Diagonální*, *Hyper sudoku*
- [ ] Automatická nápověda (next single, naked pairs atp.)

---

## Technický dluh — průběžně

- [ ] Až se najde lepší alternativa, vyřešit transitivní vulnerability ve `vite-plugin-pwa`
- [ ] Upgrade na Vite 8, až `vite-plugin-pwa` podpoří
- [ ] Pokrytí testy > 80 % pro celý kód (ne jen `game/`)
