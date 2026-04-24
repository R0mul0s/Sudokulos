# Sudoku

PWA hra sudoku — klasický mód a (v plánu) killer sudoku. Offline hratelné na telefonu i desktopu.

**Stack:** Vite 7 + React 19 + TypeScript · Tailwind CSS v4 · Zustand · i18next (cs/en) · vite-plugin-pwa · Vitest.

## Dev

```bash
npm install
npm run dev        # dev server na http://localhost:5173
npm run test       # Vitest ve watch módu
npm run test:run   # Vitest jednorázově
npm run build      # produkční build do dist/
npm run preview    # preview produkčního buildu (service worker aktivní)
npm run lint       # ESLint
npm run format     # Prettier
npm run icons      # Regenerace PNG ikon ze public/icon.svg (vyžaduje sharp)
```

## Dokumentace

- [docs/ROADMAP.md](docs/ROADMAP.md) — plán fází, hotové a zbývající úkoly
- [docs/coding-guidelines.md](docs/coding-guidelines.md) — pravidla pro psaní kódu, struktury, stylů
- [docs/DEPLOY.md](docs/DEPLOY.md) — deploy na Vercel přes GitHub

## Struktura

```
src/
├── components/       React komponenty (Board, Cell, NumberPad, MenuScreen, …)
├── game/             Čistá herní logika (validator, solver, generator, notes)
├── hooks/            Custom hooks (useGameTimer, useKeyboardControls, useInstallPrompt)
├── i18n/             Překlady cs/en a i18next setup
├── store/            Zustand stores (gameStore, settingsStore)
├── types/            Sdílené TypeScript typy
└── test/             Testovací setup
```
