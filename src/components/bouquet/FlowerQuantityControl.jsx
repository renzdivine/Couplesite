import { Minus, Plus } from 'lucide-react';

const MAX_QTY = 12;

export default function FlowerQuantityControl({ value, onChange, label }) {
  const dec = () => onChange(Math.max(0, value - 1));
  const inc = () => onChange(Math.min(MAX_QTY, value + 1));

  return (
    <div className="bb-qty" role="group" aria-label={`${label} quantity`}>
      <button
        type="button"
        className="bb-qty-btn"
        onClick={dec}
        disabled={value <= 0}
        aria-label={`Decrease ${label}`}
      >
        <Minus size={14} strokeWidth={2.5} />
      </button>
      <span className="bb-qty-value" aria-live="polite">{value}</span>
      <button
        type="button"
        className="bb-qty-btn"
        onClick={inc}
        disabled={value >= MAX_QTY}
        aria-label={`Increase ${label}`}
      >
        <Plus size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}
