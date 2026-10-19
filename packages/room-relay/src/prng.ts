/**
 * Hashes a string or numeric seed into an unsigned 32-bit integer using
 * FNV-1a + MurmurHash3 avalanche finalizer.
 */
export function hashSeed(seed: string | number): number {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    let h = (Math.trunc(seed) ^ 0x811c9dc5) >>> 0;
    h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    return (h ^ (h >>> 16)) >>> 0;
  }

  const str = String(seed);
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * Creates a deterministic 32-bit Mulberry32 pseudo-random number generator
 * returning uniformly distributed floats in `[0, 1)`.
 */
export function createSeededRng(seed: string | number): () => number {
  let state = hashSeed(seed) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Pure, non-mutating Fisher-Yates shuffle driven by a deterministic seed.
 * Given identical input items and `seed`, all peers produce the exact same permutation.
 */
export function shuffleWithSeed<T>(
  items: readonly T[],
  seed: string | number,
): T[] {
  const copy = [...items];
  const rng = createSeededRng(seed);
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = temp;
  }
  return copy;
}

