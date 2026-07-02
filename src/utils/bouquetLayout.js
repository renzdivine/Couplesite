import { FLOWER_BY_ID } from '../data/flowers';

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/** Deterministic PRNG from a numeric seed */
export function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/** Stable hash string from flower quantities */
export function hashSelection(quantities) {
  return Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, qty]) => `${id}:${qty}`)
    .join('|');
}

/** Numeric seed from a string */
export function seedFromString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Build a natural-looking bouquet layout from flower quantities.
 * Returns positioned flower instances with depth, rotation, and scale.
 */
export function generateBouquetLayout(quantities, seed) {
  const instances = [];
  let idx = 0;

  for (const [flowerId, qty] of Object.entries(quantities)) {
    if (!qty || qty <= 0) continue;
    const meta = FLOWER_BY_ID[flowerId];
    if (!meta) continue;

    for (let i = 0; i < qty; i++) {
      instances.push({
        key: `${flowerId}-${i}-${idx}`,
        flowerId,
        image: meta.image,
        baseWidth: meta.width,
        baseHeight: meta.height,
        index: idx++,
      });
    }
  }

  const total = instances.length;
  if (total === 0) return [];

  const rng = seededRandom(seed);

  // Canvas: 320×340, neck at (160, 195).
  // Flowers bottom-anchored at neck — y=0 stem at wrap top, negative = upward.
  // Scale: larger for few flowers, shrinks as count grows.
  const baseScale = Math.min(0.68, Math.max(0.32, 0.72 - total * 0.028));

  // Horizontal spread grows with flower count, but stays tight
  const hSpread = Math.min(70, 12 + total * 4);

  return instances.map((inst, i) => {
    const layer = (i + 1) / total;   // 0 (first/back) → 1 (last/front)
    const angle = i * GOLDEN_ANGLE + (rng() - 0.5) * 0.5;

    // x: fan left/right from neck centre
    const x = Math.cos(angle) * hSpread * (0.6 + rng() * 0.8);

    // y: upward offset from neck (bottom-anchored — y=0 means stem sits AT wrap top).
    // With scale ~0.5 on a 180px image → visible height ~90px.
    // Range: -5px (mostly inside wrap) to -110px (tallest outer flower).
    const yUp = 5 + layer * 105 + (rng() - 0.5) * 20;
    const y   = -yUp;

    const rotation = (rng() - 0.5) * 36;
    const scale    = baseScale * (0.82 + rng() * 0.36);

    // zIndex < 50 → behind wrap paper; >= 50 → in front
    const zIndex = 5 + Math.round(layer * 90) + Math.round(rng() * 8);

    return { ...inst, x, y, rotation, scale, zIndex };
  });
}

export function totalFlowerCount(quantities) {
  return Object.values(quantities).reduce((sum, n) => sum + (n > 0 ? n : 0), 0);
}
