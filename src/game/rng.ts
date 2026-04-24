/**
 * Seedable pseudonáhodný generátor (mulberry32) — deterministické testy generátoru a solveru.
 * Bez seedu vrací wrapper nad Math.random().
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */

export type Rng = () => number;

/**
 * Vytvoří deterministický RNG inicializovaný seedem. Algoritmus mulberry32
 * je rychlý a statisticky dostatečný pro potřeby míchání a výběru v generátoru.
 */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Default RNG — obal nad Math.random pro konzistentní API. */
export const defaultRng: Rng = () => Math.random();

/**
 * Fisher-Yates shuffle. Nemutuje vstup — vrací novou kopii.
 */
export function shuffle<T>(items: readonly T[], rng: Rng = defaultRng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Náhodné celé číslo z intervalu [min, max] včetně.
 */
export function randomInt(min: number, max: number, rng: Rng = defaultRng): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}
