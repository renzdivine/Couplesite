import { FLOWER_BY_ID } from '../data/flowers';

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export function hashSelection(quantities) {
  return Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, qty]) => `${id}:${qty}`)
    .join('|');
}

export function seedFromString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

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

  const baseScale = Math.min(0.68, Math.max(0.32, 0.72 - total * 0.028));
  const hSpread = Math.min(70, 12 + total * 4);

  return instances.map((inst, i) => {
    const layer = (i + 1) / total;
    const angle = i * GOLDEN_ANGLE + (rng() - 0.5) * 0.5;

    const x = Math.cos(angle) * hSpread * (0.6 + rng() * 0.8);

    const yUp = 5 + layer * 105 + (rng() - 0.5) * 20;
    const y   = -yUp;

    const rotation = (rng() - 0.5) * 36;
    const scale    = baseScale * (0.82 + rng() * 0.36);

    const zIndex = 5 + Math.round(layer * 90) + Math.round(rng() * 8);

    return { ...inst, x, y, rotation, scale, zIndex };
  });
}

export function totalFlowerCount(quantities) {
  return Object.values(quantities).reduce((sum, n) => sum + (n > 0 ? n : 0), 0);
}
