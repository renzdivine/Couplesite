import { FLOWER_LIBRARY } from '../../data/flowers';
import FlowerQuantityControl from './FlowerQuantityControl';

export default function FlowerSelector({ quantities, onQuantityChange }) {
  return (
    <div className="bb-selector">
      <h2 className="bb-selector-title">Choose your flowers</h2>
      <p className="bb-selector-hint">Pick any combination and set how many of each you want.</p>
      <ul className="bb-flower-list">
        {FLOWER_LIBRARY.map(flower => (
          <li key={flower.id} className="bb-flower-item">
            <div className="bb-flower-preview">
              <img
                src={flower.image}
                alt=""
                className="bb-flower-thumb"
                draggable={false}
              />
            </div>
            <div className="bb-flower-info">
              <span className="bb-flower-name">{flower.name}</span>
              <FlowerQuantityControl
                label={flower.name}
                value={quantities[flower.id] ?? 0}
                onChange={qty => onQuantityChange(flower.id, qty)}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
