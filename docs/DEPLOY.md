# Deploy — GitHub + Vercel

Tenhle dokument popisuje kroky pro první nasazení projektu na Vercel přes GitHub. Každý krok vyžaduje lidskou akci (přihlášení, autorizace, souhlas) — neprobíhá automaticky.

---

## 1. Lokální git repo

Pokud projekt ještě není pod gitem:

```bash
cd c:/Github/sudoku-game
git init
git branch -m main
git add .
git commit -m "Úvodní import: Fáze 0–4 (setup, logika, UI, flow, PWA)"
```

`.gitignore` už v projektu je — nepoušti nic před kontrolou `git status`, ať se neodešlou `node_modules/`, `dist/` nebo editor-dočasné soubory.

---

## 2. GitHub repo

1. Vytvoř nový **prázdný** repozitář na GitHubu — např. `sudoku-game`. Bez README, bez `.gitignore` (to už lokálně máme).
2. Napoj lokální repo na GitHub (URL z nově vytvořeného repa):

```bash
git remote add origin git@github.com:<username>/sudoku-game.git
git push -u origin main
```

SSH klíč pro GitHub už máš (adresář `C:\Users\roman\.ssh` je v environmentu). Pokud by bylo potřeba, ověření: `ssh -T git@github.com`.

---

## 3. Vercel projekt

1. Jdi na [vercel.com/new](https://vercel.com/new) a přihlaš se přes GitHub.
2. Vyber repozitář `sudoku-game` a klikni **Import**.
3. Vercel auto-detektuje Vite:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`
4. Klikni **Deploy**. První build běží ~1 minutu.
5. Po buildu je aplikace na `<name>.vercel.app`. Vercel ti nabídne přidat vlastní doménu (volitelné).

### Nastavení pro PWA

Žádná speciální konfigurace Vercelu není potřeba — Vite PWA plugin vygeneruje `manifest.webmanifest` a `sw.js` při každém buildu. Service worker se na produkční doméně registruje automaticky (na localhostu funguje jen ve `preview` modu, ne `dev`).

Pokud bys chtěl vynutit HTTPS redirect (default už je zapnutý) nebo headers, přidej `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/sw.js",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }]
    }
  ]
}
```

Tohle zajistí, že service worker se vždy stáhne znovu (jinak může zůstat stará verze v cache).

---

## 4. Každý další push

Po prvním nasazení Vercel auto-deployuje:
- Push do `main` → produkční deploy (`<name>.vercel.app`)
- Push do jiné větve → preview deploy (`<name>-<hash>.vercel.app`)

Pro lokální pre-deploy test:
```bash
npm run build
npm run preview
```
Otevře aplikaci na `http://localhost:4173` s produkčním bundlem a aktivním service workerem. Můžeš tam v DevTools → Application → Service Workers ověřit, že je worker registrovaný, a v Application → Manifest zkontrolovat ikony a metadata.

---

## 5. Instalace na telefonu

- **Android Chrome/Edge**: Menu → *Přidat na plochu* (nebo klikni na banner "Nainstalovat jako aplikaci" v menu hry)
- **iOS Safari**: Sdílet → *Přidat na plochu*
- **Desktop Chrome/Edge**: ikona plus v adresním řádku

Po instalaci se aplikace spouští v samostatném okně bez browser chrome a běží i offline (s výjimkou prvního načtení — service worker se registruje až během prvního návštěvy).

---

## Ověření, že deploy proběhl v pořádku

Po nasazení otevři produkční URL a zkontroluj:

- [ ] HTTP status 200 na `/`
- [ ] `/manifest.webmanifest` dostupný a validní
- [ ] `/sw.js` dostupný
- [ ] `/pwa-192x192.png`, `/pwa-512x512.png` načítají
- [ ] Lighthouse PWA audit v DevTools — minimálně *Installable* ✓
- [ ] V Chrome DevTools → Application → Service Workers je worker registrovaný a aktivní
- [ ] Po prvním návštěvě offline mode (DevTools → Network → Offline) stále funguje

---

## Co dělat, když se něco rozbije

- **Build na Vercelu selže**: lokálně `npm run build`, oprav chyby, push znovu
- **SW po deployi servíruje starou verzi**: v DevTools → Application → Service Workers klikni *Update on reload* + *Clear storage* (pro vývoj). V produkci je auto-update přes `registerType: 'autoUpdate'` v [vite.config.ts](../vite.config.ts)
- **Ikony chybí na produkci**: zkontroluj `dist/` po `npm run build` — měly by tam být všechny PNG
