import { useMemo } from 'react';
import { useSpring, useTrail, animated } from '@react-spring/web';

const CANVAS_W = 320;
const CANVAS_H = 340;
const NECK_X   = 160;
const NECK_Y   = 195;

function WrapSVG({ total }) {
  const wrapScale = Math.min(1.15, 0.85 + total * 0.04);
  
  return (
    <g transform={`translate(${CANVAS_W / 2}, 200) scale(${wrapScale}, 1) translate(${-CANVAS_W / 2}, -200)`}>
      {}
      <g stroke="#3d6b3d" strokeWidth="2" strokeLinecap="round">
        <line x1="148" y1="200" x2="140" y2="260" opacity="0.75" />
        <line x1="160" y1="200" x2="160" y2="265" opacity="0.9" />
        <line x1="172" y1="200" x2="180" y2="260" opacity="0.75" />
        <line x1="138" y1="205" x2="132" y2="258" opacity="0.5" />
        <line x1="182" y1="205" x2="188" y2="258" opacity="0.5" />
      </g>
      {}
      <path
        d="M 80 205 Q 160 192 240 205 L 254 330 Q 160 344 66 330 Z"
        fill="url(#bp-paper)"
        stroke="rgba(255,230,240,0.2)"
        strokeWidth="1"
      />
      <path
        d="M 80 205 Q 160 192 240 205 L 228 222 Q 160 214 92 222 Z"
        fill="rgba(255,255,255,0.07)"
      />
      {}
      <g transform="translate(160, 220)">
        <ellipse cx="-20" cy="2" rx="17" ry="9" fill="#c9186a" opacity="0.92" transform="rotate(-25)" />
        <ellipse cx="20"  cy="2" rx="17" ry="9" fill="#c9186a" opacity="0.92" transform="rotate(25)"  />
        <circle cx="0" cy="0" r="8"  fill="#e91e8c" />
        <path d="M-5 7 Q0 24 5 7"   fill="none" stroke="#a01558" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 5 7 Q0 28 -5 7"  fill="none" stroke="#a01558" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <defs>
        <linearGradient id="bp-paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#f8e8f0" />
          <stop offset="100%" stopColor="#e0c0d0" />
        </linearGradient>
      </defs>
    </g>
  );
}

function FlowerItem({ item, springY, springOpacity }) {
  
  
  
  const cx = NECK_X + item.x;
  const cy = NECK_Y + item.y; 

  const w = item.baseWidth  * item.scale;
  const h = item.baseHeight * item.scale;

  return (
    <animated.g
      transform={springY.to(
        sy => `translate(${cx}, ${cy + sy}) rotate(${item.rotation}, 0, 0) scale(${item.scale})`
      )}
      opacity={springOpacity}
      style={{ zIndex: item.zIndex }}
    >
      {}
      <image
        href={item.image}
        x={-item.baseWidth  / 2}
        y={-item.baseHeight}       
        width={item.baseWidth}
        height={item.baseHeight}
        style={{
          mixBlendMode: 'screen',
          filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))',
        }}
        preserveAspectRatio="xMidYMid meet"
      />
    </animated.g>
  );
}

export default function BouquetPreview({ layout, total }) {
  
  const sorted = useMemo(
    () => [...layout].sort((a, b) => a.zIndex - b.zIndex),
    [layout],
  );

  const trail = useTrail(sorted.length, {
    from: { springY: 20, springOpacity: 0 },
    to:   { springY: 0,  springOpacity: 1 },
    config: { tension: 260, friction: 24 },
  });

  if (total === 0) {
    return (
      <div className="bb-preview bb-preview--empty">
        <div className="bb-preview-placeholder">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
            <path d="M12 22c4-4 8-7.5 8-12a8 8 0 1 0-16 0c0 4.5 4 8 8 12z" />
          </svg>
          <p>Select flowers to begin your bouquet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bb-preview" aria-label={`Bouquet with ${total} flowers`}>
      {}
      <svg
        className="bb-stage-svg"
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        width="100%"
        style={{ maxWidth: 320, display: 'block', margin: '0 auto' }}
        aria-hidden="true"
      >
        {}
        {sorted.map((item, i) =>
          item.zIndex < 50 ? (
            <FlowerItem
              key={item.key}
              item={item}
              springY={trail[i].springY}
              springOpacity={trail[i].springOpacity}
            />
          ) : null
        )}

        {}
        <WrapSVG total={total} />

        {}
        {sorted.map((item, i) =>
          item.zIndex >= 50 ? (
            <FlowerItem
              key={item.key}
              item={item}
              springY={trail[i].springY}
              springOpacity={trail[i].springOpacity}
            />
          ) : null
        )}
      </svg>

      <p className="bb-preview-count">
        {total} flower{total !== 1 ? 's' : ''} in your bouquet
      </p>
    </div>
  );
}
