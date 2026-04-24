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

## Fáze 6 — Killer Sudoku ✅

### 6.1 Datový model

- ✅ `GameMode = 'classic' | 'killer'`
- ✅ `types/killer.ts` — `Cage { id, sum, cells }`, `KillerPuzzle`

### 6.2 Logika

- ✅ `game/killer/config.ts` — min/max velikost klecí per obtížnost
- ✅ `game/killer/validator.ts` — buildCageLookup, findCageConflicts (duplicity + součty), isValidKillerPlacement
- ✅ `game/killer/solver.ts` — backtracking s distinct min/maxSumOfN propagací, ploché buffery místo Map
- ✅ `game/killer/generator.ts` — growing algoritmus (4-adjacentní buňky bez duplicitních hodnot v solution), ověření unikátnosti přes countKillerSolutions

### 6.3 UI

- ✅ `components/killer/CageOverlay.tsx` — SVG overlay s přerušovanou čarou okolo klecí + sum label (dark: support)
- ✅ `Board` kreslí CageOverlay v killer módu a k `findConflicts` přidává `findCageConflicts` pro error indikaci

### 6.4 Integrace

- ✅ MenuScreen: toggle klasika/killer nad výběrem obtížnosti
- ✅ gameStore: `cages: Cage[] | null`, startNewGame větví, persist cages
- ✅ i18n: `mode.classic/killer`, `menu.chooseMode`
- ✅ StatsScreen: filtr historie podle vybraného módu (klasika/killer samostatně)

**Konfigurace klecí:**
- Easy: max 2 (hlavně dvojice — silný constraint)
- Medium: max 3
- Hard: max 4
- Expert: max 4 (původně 5 — generátor trval >5 s, kvůli non-unique puzzles nutných k regeneraci)

**Testy:** 25 nových (validator 13, solver 6, generator 6). Celkem 135. Solver běží na plochých číselných bufferech s `minSumOfN`/`maxSumOfN` pro přesnou dolní/horní mez zbývajících součtů. Build 92.8 kB gzipped.

**DoD splněno:** killer sudoku hratelné ve všech obtížnostech, zadání s garantovaně unikátním řešením, UI kreslí klece přes mřížku, statistiky rozlišují módy.

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

## Fáze 8 — RPG Roguelike mód ⏳

Nový herní mód nad existujícím sudoku enginem. Hráč prochází **run** = sekvenci 5–7 puzzle úrovní rostoucí obtížnosti, sbírá relics a zlato, bojuje proti bossovi, umírá (permadeath) a nese si jen **souls** jako meta progression.

### 8.1 Game loop — 4 zoomy

**Tah** (1 s) — vyplnění buňky → combo zvýší, chain reaction může spustit bonus  
**Level** (3–8 min) — vyřešit puzzle bez ztráty všech HP, max. vytěžit mechaniky  
**Run** (20–40 min) — 7 uzlů (battle → elite → shop → boss), vybudovat synergii relics  
**Meta** (týdny) — souls, odemykání tříd / relics / startovních bonusů

### 8.2 Struktura runu

Lineární mapa s lehkým větvením, **7 uzlů**:

```
[1 battle] → [2 battle] → [3 mystery?] → [4 battle] → [5 elite] → [6 shop] → [7 BOSS]
```

Typy uzlů:
- **⚔️ Battle** — klasický puzzle, obtížnost škáluje s pozicí
- **❓ Mystery** — náhodná událost (Oltář: −HP za relic / Rest: +HP / Chest: zlato nebo scroll)
- **💀 Elite** — tvrdší puzzle (corrupted givens nebo hard killer), lepší drop
- **🏪 Shop** — utrát zlato za relics, potions, power-up scrolls
- **👑 Boss** — puzzle variant (killer s časovým limitem nebo diagonal sudoku) + environmental effect

### 8.3 Datový model

Nové typy (`src/types/rpg.ts`):
- `Run` — id, seed, třída, mapa uzlů, current node index, hráčův stav
- `RunNode` — typ (battle/elite/mystery/shop/boss), difficulty, dokončeno?
- `PlayerState` — maxHp, hp, maxMana, mana, gold, relics[], powerUpSlot, xp
- `Relic` — id, name, rarity (common/uncommon/rare), effect (passive descriptor)
- `PowerUp` — id, name, effect (peek/shield/swap), charges
- `RunResult` — won, levelsCompleted, finalHp, relics, souls
- `PlayerProfile` (meta) — totalRuns, wins, souls, unlockedClasses, unlockedRelics, bestRun

Nové stores:
- `runStore` (Zustand, persist) — aktuální run state, aktuální puzzle se stavem, combo counter, lucky cells
- `profileStore` (Zustand, persist) — meta profile (souls, odemknutí)

### 8.4 Core mechaniky

#### HP systém
- Startovní maxHp dle třídy (3 default)
- Chyba v puzzle = −1 HP (nebo víc, pokud trigger). HP=0 → end of run.
- Různé zdroje HP: Rest nody (+2 HP), Potions (+1 HP okamžitě), některé relics

#### Combo streak
- Každé správné vyplnění zvýší `combo` (×1, ×2, ×3, ...)
- `combo ≥ 2` dává bonus na každý další tah: `+combo × 5 gold`, `+combo mana`
- Chyba combo resetuje na 0
- Visualizace: číslo "×3" u HUD, animace při novém milníku (×5, ×10, ×20)

#### Chain reaction
- Vyplnění poslední prázdné buňky v řádku / sloupci / bloku spustí "chain"
- Jeden chain: +10 many nebo +50 zlata (flavor podle třídy)
- Dvojitý chain (2 skupiny dokončené jedním tahem): super-bonus (+25 many)
- Trojitý chain: ultra-bonus (drop powerupu zdarma)
- Vizuální: flash přes dokončenou skupinu, particle efekt

#### Lucky cells
- Na startu levelu se 2–3 buňky označí hvězdičkou ⭐
- Správně vyplněná lucky buňka → drop (potion / gold / mana)
- Špatně vyplněná = dvojitá HP penalty (−2 místo −1)

#### Power-up slot
- 1 slot = 1 power-up použitelný v aktuálním levelu
- Scrolls z dropů se dávají do slotu (pokud je prázdný) nebo nahrazují aktuální
- Power-ups:
  - **Peek** — 3 sekundy zobrazí správnou hodnotu selected buňky
  - **Shield** — příští chyba se nepočítá jako mistake
  - **Swap** — prohodit hodnoty 2 libovolných buněk (zachraňuje chybu)

#### Environmental effects (bossové a elites)
- **Bouře**: každých 60 s se smaže náhodná poznámka
- **Mráz**: 2 náhodné buňky zamrzne na 20 s (nelze upravit)
- **Temnota**: viditelný jen aktuální 3×3 blok, zbytek ztmavený
- **Světlo**: +30 s bonusový čas, ale −1 max HP

### 8.5 Relics

Passivní bonusy aktivní po celý run. Sbírají se z dropů, elit, bossů, obchodů.

**Starter pool (~15 kusů):**

| Rarity | Název | Efekt |
|---|---|---|
| Common | Amulet vhledu | auto-notes po každém vyplnění |
| Common | Měděný prsten | +10 zlata za dokončený level |
| Common | Kožená rukavice | +1 maxHp |
| Common | Stříbrný řetěz | +5 maxMana |
| Common | Lahvička many | 1× za level obnoví 5 many |
| Uncommon | Dračí šupina | první chyba v levelu je odpuštěná |
| Uncommon | Plamenná koruna | +25 % gold bonus pod 3 minuty |
| Uncommon | Kniha zaklínání | power-up slot má 2 nabití |
| Uncommon | Oko ostrého zraku | peer highlight se rozšíří o diagonály |
| Rare | Fénix | jednou za run oživne hráče na 1 HP |
| Rare | Kamenný totem | chain reaction dává dvojnásobný bonus |
| Rare | Stín | lucky cells jsou 5 místo 3 |
| Rare | Oltář krve | obětuj −1 HP za +50 zlata (aktivní tlačítko) |
| Rare | Zrcadlo | každá hvězdička zní na 2 buňkách |
| Rare | Hodinky zpětného času | jednou za run undo posledních 5 tahů |

### 8.6 Meta progression

Při ukončení runu (úspěch i smrt) hráč získá **souls** podle výkonu:
- Úroveň progresie × 10 — např. smrt na 3. uzlu = 30 souls
- Bonus za bosse: +80 souls
- Vítězství runu: +150 souls + 3★ runs získává unikátní relic do meta pool

Souls v profilu jdou utratit:
- **Nová třída** (100–300 souls) — Mnich, Mág, Válečník, Rogue
- **Nový relic do dropovací pool** (50–150 souls dle rarity)
- **Startovní bonus** (200 souls) — např. +1 maxHp, extra potion, první relic zdarma
- **Nová boss varianta** (300 souls) — odemkne speciální boss na další runy

### 8.7 Rozpad na iterace

Postavíme ve 3 fázích, každou oddělitelně testovatelnou.

#### Fáze 8.1 — MVP (prototyp) 🎯

Nejdůležitější — ověřit, jestli je loop zábavný.

- [ ] `types/rpg.ts` — PlayerState, Run, RunNode (jen battle typ)
- [ ] `store/runStore.ts` — start/end run, progress mezi uzly, záznam puzzle výsledku
- [ ] `store/profileStore.ts` — souls, základní statistiky (bez odemykání)
- [ ] Rozšířit `gameStore` o run context — hp, combo, chain tracking
  - HP decrement při chybě
  - Combo counter v state
  - Chain detection na každý setDigit
- [ ] Nové obrazovky:
  - `RunMapScreen` — vizualizace 7 uzlů, aktuální pozice, přechod na puzzle
  - `RunHud` — overlay v GameScreen s HP, mana, combo, relics ikony
  - `RewardScreen` — 3-volba dropu po dokončení levelu
  - `RunEndScreen` — summary + souls
- [ ] **5 core relics** (easy do implementace): Amulet vhledu, Měděný prsten, Kožená rukavice, Dračí šupina, Fénix
- [ ] 1 třída (default: Válečník — maxHp 3, maxMana 10)
- [ ] Pouze battle uzly (bez elite/shop/mystery)
- [ ] Jeden boss na konci — killer puzzle s 10 min limitem
- [ ] i18n (cs/en) pro RPG terminologii
- [ ] Tlačítko v MenuScreen "🎮 RPG Run"

**DoD:** lze odehrát kompletní 5-level run od začátku do smrti/vítězství, souls se ukládají, relics aplikují efekty.

#### Fáze 8.2 — Rozšíření 🔧

- [ ] Zbývajících ~10 relics (zejména z uncommon a rare)
- [ ] Elite a mystery uzly
- [ ] Shop s nákupem (potions, scrolls, relics)
- [ ] Power-up systém (Peek / Shield / Swap)
- [ ] Lucky cells mechanika
- [ ] 2–3 další třídy (Mnich, Mág, Rogue)
- [ ] Odemykání v profilu (spending souls)
- [ ] Statistiky RPG módu separátně v StatsScreen

#### Fáze 8.3 — Polish 🎨

- [ ] Environmental effects (Bouře, Mráz, Temnota, Světlo) na elite/boss
- [ ] Animace na chain reaction, combo milestones, lucky cell hit
- [ ] Boss variants (diagonal sudoku, speciální killer)
- [ ] Zvuková odezva (pokud přidáme audio assety)
- [ ] Tutorial / onboarding první run
- [ ] Vyladění obtížnostní křivky podle telemetrie (kolik % runs končí na který uzel)

### 8.8 Závislosti a rizika

- **Balans**: roguelike módy vyžadují iterativní balancování. Po MVP udělat alespoň 5 kompletních runs ručně a dolaďovat čísla.
- **Persistence**: runStore v localStorage drží aktivní run — pokud se zjevní inkonzistence mezi verzemi kódu a uloženým runem, musíme mít reset logiku.
- **UI space**: RunHud přidává elementy nad už plný GameScreen. Na mobilu musíme řešit výšku (případně skrývací panel s detaily).
- **i18n**: RPG flavor text (relics descriptions, event popupy) je hodně textu. Můžeme začít jen s cz, en přidat později.

**DoD Fáze 8 celkem:** hráč může opakovaně spouštět runy s odlišnou hratelností díky relics, obtížnost se škáluje, souls-based progression motivuje k dalším runům. Kompletní mód s minimálně 3 třídami, 15 relics, 7 uzlů na run.

---

## Technický dluh — průběžně

- [ ] Až se najde lepší alternativa, vyřešit transitivní vulnerability ve `vite-plugin-pwa`
- [ ] Upgrade na Vite 8, až `vite-plugin-pwa` podpoří
- [ ] Pokrytí testy > 80 % pro celý kód (ne jen `game/`)
