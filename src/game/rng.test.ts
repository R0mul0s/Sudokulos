/**
 * Testy seedable RNG.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { describe, expect, it } from 'vitest';
import { createRng, randomInt, shuffle } from './rng';

describe('createRng', () => {
  it('vrací hodnoty v intervalu [0, 1)', () => {
    const rng = createRng(42);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('je deterministický pro stejný seed', () => {
    const rng1 = createRng(12345);
    const rng2 = createRng(12345);
    for (let i = 0; i < 20; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('dává různé sekvence pro různé seedy', () => {
    const rng1 = createRng(1);
    const rng2 = createRng(2);
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).not.toEqual(seq2);
  });
});

describe('shuffle', () => {
  it('nemutuje vstup', () => {
    const input = [1, 2, 3, 4, 5];
    const copy = input.slice();
    shuffle(input, createRng(1));
    expect(input).toEqual(copy);
  });

  it('obsahuje všechny prvky (jen v jiném pořadí)', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const shuffled = shuffle(input, createRng(42));
    expect(shuffled.slice().sort()).toEqual(input);
  });

  it('je deterministický se seedem', () => {
    const input = [1, 2, 3, 4, 5];
    const a = shuffle(input, createRng(7));
    const b = shuffle(input, createRng(7));
    expect(a).toEqual(b);
  });
});

describe('randomInt', () => {
  it('vrací celé číslo v rozsahu [min, max]', () => {
    const rng = createRng(123);
    for (let i = 0; i < 100; i++) {
      const v = randomInt(5, 10, rng);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThanOrEqual(10);
    }
  });
});
