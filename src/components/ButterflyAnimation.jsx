import { useState, useMemo } from 'react';

const BUTTERFLY_WIDTH  = 52;
const BUTTERFLY_HEIGHT = 44;


function Butterfly({ color, flapAngle, flapDuration, bobDuration, uid }) {
  return (
    <svg
      width={BUTTERFLY_WIDTH}
      height={BUTTERFLY_HEIGHT}
      viewBox="0 0 140 120"
      style={{
        display: 'block',
        overflow: 'visible',
        animation: `bodyBob${uid} ${bobDuration}ms ease-in-out infinite`,
      }}
    >
      <defs>
        <linearGradient id={`UL${uid}`} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#d4a0ff" />
          <stop offset="45%"  stopColor={color} />
          <stop offset="100%" stopColor="#4a0a2e" />
        </linearGradient>
        <linearGradient id={`UR${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#d4a0ff" />
          <stop offset="45%"  stopColor={color} />
          <stop offset="100%" stopColor="#4a0a2e" />
        </linearGradient>
        <linearGradient id={`LL${uid}`} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor={color} />
          <stop offset="100%" stopColor="#4a0a2e" />
        </linearGradient>
        <linearGradient id={`LR${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor={color} />
          <stop offset="100%" stopColor="#4a0a2e" />
        </linearGradient>
        {}
      </defs>

      {}
      <g style={{ transformOrigin: '70px 58px', animation: `flapL${uid} ${flapDuration}ms ease-in-out infinite` }}>
        <ellipse cx="36"  cy="34" rx="34" ry="24" fill={`url(#UL${uid})`} />
        <line x1="70" y1="34" x2="14"  y2="18" stroke="rgba(80,0,40,0.5)" strokeWidth="1.4" />
        <line x1="70" y1="38" x2="10"  y2="38" stroke="rgba(80,0,40,0.5)" strokeWidth="1.2" />
        <line x1="70" y1="42" x2="16"  y2="54" stroke="rgba(80,0,40,0.4)" strokeWidth="1" />
        <ellipse cx="38"  cy="76" rx="24" ry="18" fill={`url(#LL${uid})`} />
        <ellipse cx="30"  cy="28" rx="14" ry="10" fill="rgba(255,255,255,0.13)" />
      </g>

      {}
      <g style={{ transformOrigin: '70px 58px', animation: `flapR${uid} ${flapDuration}ms ease-in-out infinite` }}>
        <ellipse cx="104" cy="34" rx="34" ry="24" fill={`url(#UR${uid})`} />
        <line x1="70" y1="34" x2="126" y2="18" stroke="rgba(80,0,40,0.5)" strokeWidth="1.4" />
        <line x1="70" y1="38" x2="130" y2="38" stroke="rgba(80,0,40,0.5)" strokeWidth="1.2" />
        <line x1="70" y1="42" x2="124" y2="54" stroke="rgba(80,0,40,0.4)" strokeWidth="1" />
        <ellipse cx="102" cy="76" rx="24" ry="18" fill={`url(#LR${uid})`} />
        <ellipse cx="110" cy="28" rx="14" ry="10" fill="rgba(255,255,255,0.13)" />
      </g>

      {}
      <ellipse cx="70" cy="58" rx="4.5" ry="27" fill="#2d0010" />
      <ellipse cx="70" cy="58" rx="2.2" ry="26" fill={color} opacity="0.35" />
      <circle  cx="70" cy="31" r="6"  fill="#2d0010" />
      <line x1="70" y1="26" x2="56" y2="8" stroke="#2d0010" strokeWidth="1.8" />
      <line x1="70" y1="26" x2="84" y2="8" stroke="#2d0010" strokeWidth="1.8" />
      <circle cx="56" cy="8" r="3" fill={color} />
      <circle cx="84" cy="8" r="3" fill={color} />
    </svg>
  );
}

function rnd(range) {
  return (Math.random() - 0.5) * 2 * range;
}

const BUTTERFLY_COLORS = [
  '#ff9ab5','#e91e8c','#d4a0ff','#ffb3cc','#f472b6','#c084fc',
  '#fda4af','#ff6b9d','#ffb347','#ff85a1','#e040fb','#b39ddb',
  '#ff80ab','#ea80fc',
];


export default function ButterflyAnimation({ active, origin }) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const spawnX = origin ? (origin.x - vw / 2) : 0;
  const spawnY = origin ? (origin.y - vh / 2) : 0;

  const [groups] = useState(() => {
    const count = 50;

    
    const cols  = 10;
    const rows  = 5;
    const cellW = vw / cols;
    const cellH = vh / rows;

    return Array.from({ length: count }, (_, i) => {
      const col    = i % cols;
      const row    = Math.floor(i / cols) % rows;

      
      const finalX = (col * cellW + cellW * 0.15 + Math.random() * cellW * 0.7) - vw / 2;
      const finalY = (row * cellH + cellH * 0.15 + Math.random() * cellH * 0.7) - vh / 2;

      
      
      const midX = (spawnX + finalX) / 2 + rnd(vw * 0.18);
      const midY = (spawnY + finalY) / 2 + rnd(vh * 0.18);

      return {
        finalX, finalY,
        midX, midY,
        
        startDelay:   i * 0.06 + Math.random() * 0.2,
        
        
        duration:     5.5 + Math.random() * 3.0,
        color:        BUTTERFLY_COLORS[i % BUTTERFLY_COLORS.length],
        flapAngle:    45 + Math.random() * 35,
        flapDuration: 700  + Math.random() * 550,
        bobDuration:  600  + Math.random() * 500,
        
        tilt:         rnd(22),
        uid:          `bf${i}`,
      };
    });
  });

  
  const allKeyframes = useMemo(() => {
    
    const svgKF = groups.map((b) => `
      @keyframes flapL${b.uid} {
        0%,100% { transform: perspective(300px) rotateY(0deg); }
        50%     { transform: perspective(300px) rotateY(${-b.flapAngle}deg); }
      }
      @keyframes flapR${b.uid} {
        0%,100% { transform: perspective(300px) rotateY(0deg); }
        50%     { transform: perspective(300px) rotateY(${b.flapAngle}deg); }
      }
      @keyframes bodyBob${b.uid} {
        0%,100% { transform: translateY(0px) rotate(0deg); }
        33%     { transform: translateY(-4px) rotate(-2deg); }
        66%     { transform: translateY(3px)  rotate(2deg); }
      }
    `).join('');

    
    const tr = (x, y, scale = 1) =>
      `translate(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px)) scale(${scale})`;

    const flightKF = groups.map((b) => `
      @keyframes ${b.uid}Fly {
        0%   { transform: ${tr(spawnX, spawnY, 0.3)}; }
        40%  { transform: ${tr(b.midX,  b.midY,  1.0)}; }
        100% { transform: ${tr(b.finalX, b.finalY, 1.0)}; }
      }
      @keyframes ${b.uid}Fade {
        0%   { opacity: 0; }
        100% { opacity: 1; }
      }
      @keyframes ${b.uid}Tilt {
        0%   { transform: rotate(0deg); }
        30%  { transform: rotate(${b.tilt}deg); }
        70%  { transform: rotate(${-b.tilt * 0.5}deg); }
        100% { transform: rotate(0deg); }
      }
    `).join('');

    return svgKF + flightKF;
  }, [groups, spawnX, spawnY]);

  if (!active) return null;

  const containerStyle = {
    position:      'fixed',
    top:           '50vh',
    left:          '50vw',
    pointerEvents: 'none',
    zIndex:        1201,
  };

  return (
    <>
      <div style={containerStyle}>
        {groups.map((b) => (
          <div
            key={b.uid}
            style={{
              position: 'absolute',
              top: 0, left: 0,
              opacity: 0,
              willChange: 'transform, opacity',
              
              
              
              animation: [
                `${b.uid}Fly  ${b.duration}s cubic-bezier(0.2, 0.6, 0.4, 1) ${b.startDelay}s forwards`,
                `${b.uid}Fade ${b.duration * 0.15}s ease-out ${b.startDelay}s forwards`,
              ].join(', '),
            }}
          >
            {}
            <div style={{
              animation: `${b.uid}Tilt ${b.duration}s ease-in-out ${b.startDelay}s forwards`,
            }}>
              <Butterfly
                color={b.color}
                flapAngle={b.flapAngle}
                flapDuration={b.flapDuration}
                bobDuration={b.bobDuration}
                uid={b.uid}
              />
            </div>
          </div>
        ))}
      </div>

      {}
      <style>{allKeyframes}</style>
    </>
  );
}
