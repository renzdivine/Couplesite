import { useCallback, useMemo, useState } from 'react';
import { Sparkles, Save } from 'lucide-react';
import { EMPTY_QUANTITIES } from '../../data/flowers';
import {
  generateBouquetLayout,
  hashSelection,
  seedFromString,
  totalFlowerCount,
} from '../../utils/bouquetLayout';
import FlowerSelector from './FlowerSelector';
import BouquetPreview from './BouquetPreview';
import '../../styles/components/BouquetBuilder.css';

/**
 * BouquetBuilder
 *
 * Props:
 *  - readOnly (bool)   — visitor view: shows saved layout only, no controls
 *  - savedQuantities   — quantities object from couple data (used in readOnly mode)
 *  - savedSeed         — numeric seed from couple data (used in readOnly mode)
 *  - coupleSlug        — slug of the couple, used when saving
 *  - onSave(qty, seed) — callback after client saves their bouquet
 */
export default function BouquetBuilder({
  readOnly = false,
  savedQuantities,
  savedSeed,
  onSave,
}) {
  const [quantities, setQuantities] = useState(
    () => savedQuantities ? { ...EMPTY_QUANTITIES, ...savedQuantities } : { ...EMPTY_QUANTITIES }
  );
  const [layoutSeed, setLayoutSeed] = useState(() => savedSeed ?? Date.now());
  const [saved, setSaved] = useState(!!savedQuantities);

  const total = totalFlowerCount(quantities);

  const layout = useMemo(() => {
    if (total === 0) return [];
    const baseSeed = seedFromString(hashSelection(quantities));
    return generateBouquetLayout(quantities, baseSeed ^ layoutSeed);
  }, [quantities, layoutSeed, total]);

  const handleQuantityChange = useCallback((flowerId, qty) => {
    setQuantities(prev => ({ ...prev, [flowerId]: qty }));
    setSaved(false);
  }, []);

  const handleGenerate = useCallback(() => {
    if (total === 0) return;
    const newSeed = Date.now();
    setLayoutSeed(newSeed);
    setSaved(false);
  }, [total]);

  const handleSave = useCallback(() => {
    if (total === 0) return;
    onSave?.(quantities, layoutSeed);
    setSaved(true);
  }, [total, quantities, layoutSeed, onSave]);

  /* ── Visitor read-only view ── */
  if (readOnly) {
    // No saved bouquet yet — show nothing
    if (!savedQuantities || totalFlowerCount(savedQuantities) === 0) return null;

    return (
      <section className="bb-root bb-root--readonly" aria-label="Bouquet">
        <div className="bb-preview-col" style={{ maxWidth: 360, margin: '0 auto' }}>
          <BouquetPreview layout={layout} total={total} />
        </div>
      </section>
    );
  }

  /* ── Client editable view ── */
  return (
    <section className="bb-root" aria-labelledby="bb-heading">
      <div className="bb-intro">
        <h2 id="bb-heading" className="bb-title">Build a Bouquet</h2>
        <p className="bb-subtitle">Craft a custom bouquet from your favorite blooms</p>
      </div>

      <div className="bb-layout">
        <FlowerSelector
          quantities={quantities}
          onQuantityChange={handleQuantityChange}
        />

        <div className="bb-preview-col">
          <BouquetPreview layout={layout} total={total} />

          <div className="bb-actions">
            <button
              type="button"
              className="bb-generate-btn"
              onClick={handleGenerate}
              disabled={total === 0}
            >
              <Sparkles size={18} strokeWidth={2} aria-hidden="true" />
              Generate Bouquet
            </button>

            <button
              type="button"
              className="bb-save-btn"
              onClick={handleSave}
              disabled={total === 0 || saved}
            >
              <Save size={16} strokeWidth={2} aria-hidden="true" />
              {saved ? 'Saved!' : 'Save Bouquet'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
