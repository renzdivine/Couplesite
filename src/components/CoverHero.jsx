/**
 * CoverHero — Realistic scrapbook journal hero for ButterflyLetters Slide 1.
 *
 * Realism techniques:
 *  • SVG feTurbulence + feDisplacementMap  → organic torn-paper heart edge
 *  • Canvas procedural noise               → kraft paper grain texture
 *  • @react-spring/web useSpring           → physics-based float & entrance
 *  • Layered SVG filters (feDropShadow)    → real depth on photo frame
 *  • CSS perspective + rotateX            → 3-D page curl on spiral spine
 *  • Multi-stop radial gradients           → paper aging / foxing spots
 */
import { useEffect, useRef, useState } from 'react';
import { useSpring, useTrail, animated } from '@react-spring/web';
import { EditableText } from './EditableField';
import { useImageUrl }  from '../utils/useImageUrl';
import '../styles/components/CoverHero.css';

/* ─── Unique filter IDs per mount so multiple instances don't clash ─── */
let _uid = 0;
const uid = () => `ch${++_uid}`;

/* ─── Canvas noise texture — drawn once at reduced resolution ── */
function useKraftCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    // Defer heavy canvas work until browser is idle
    const run = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      // Draw at half-resolution for speed, CSS scales it up
      const w = Math.round((parent ? parent.offsetWidth  || 1100 : 1100) / 2);
      const h = Math.round((parent ? parent.offsetHeight || 630  : 630)  / 2);
      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');

      // Base warm kraft colour
      ctx.fillStyle = '#c8a96e';
      ctx.fillRect(0, 0, w, h);

      // Fibrous horizontal streaks — step by 3 instead of 2
      for (let y = 0; y < h; y += 3) {
        const alpha = Math.random() * 0.06;
        ctx.strokeStyle = `rgba(${160 + Math.random()*40|0},${120+Math.random()*30|0},${60+Math.random()*20|0},${alpha})`;
        ctx.lineWidth = 1 + Math.random();
        ctx.beginPath();
        ctx.moveTo(0, y + Math.random());
        ctx.lineTo(w, y + Math.random());
        ctx.stroke();
      }

      // Noise pixels — sample every 2nd pixel for speed
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 8) { // step 8 = every other pixel
        const n = (Math.random() - 0.5) * 24;
        d[i]   = Math.min(255, Math.max(0, d[i]   + n));
        d[i+1] = Math.min(255, Math.max(0, d[i+1] + n * 0.8));
        d[i+2] = Math.min(255, Math.max(0, d[i+2] + n * 0.5));
      }
      ctx.putImageData(imgData, 0, 0);

      // Aging spots — reduced to 20
      for (let k = 0; k < 20; k++) {
        const gx = Math.random() * w;
        const gy = Math.random() * h;
        const gr = ctx.createRadialGradient(gx, gy, 0, gx, gy, 15 + Math.random() * 40);
        gr.addColorStop(0,   `rgba(100,70,30,${0.03 + Math.random() * 0.05})`);
        gr.addColorStop(1,   'rgba(100,70,30,0)');
        ctx.fillStyle = gr;
        ctx.fillRect(gx - 50, gy - 50, 100, 100);
      }
    };

    // Use requestIdleCallback if available, else setTimeout
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(run, { timeout: 1000 });
      return () => cancelIdleCallback(id);
    } else {
      const id = setTimeout(run, 100);
      return () => clearTimeout(id);
    }
  }, []);
  return canvasRef;
}

/* ─── Torn-paper heart (SVG filter displacement) ───────────────────── */
function HeartFrame({ photoSrc, ids }) {
  const resolved = useImageUrl(photoSrc);
  const heartPath = "M150 250 C150 250 10 158 10 72 C10 28 46 6 82 16 C104 22 128 44 150 70 C172 44 196 22 218 16 C254 6 290 28 290 72 C290 158 150 250 150 250Z";
  return (
    <svg
      className="ch-heart-svg"
      viewBox="0 0 300 260"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <defs>
        {/* Paper grain for the white torn edge */}
        <filter id={`${ids.paper}`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9 0.65" numOctaves="2" seed="8" result="noise"/>
          <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise"/>
          <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="blend"/>
          <feComposite in="blend" in2="SourceGraphic" operator="in"/>
        </filter>

        {/* Torn edge displacement */}
        <filter id={`${ids.torn}`} x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="turbulence" baseFrequency="0.045 0.06" numOctaves="3" seed="42" result="turb"/>
          <feDisplacementMap in="SourceGraphic" in2="turb" scale="14" xChannelSelector="R" yChannelSelector="G"/>
        </filter>

        {/* Soft drop-shadow for the whole frame */}
        <filter id={`${ids.shadow}`} x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="6" dy="10" stdDeviation="12" floodColor="rgba(40,20,0,0.45)"/>
        </filter>

        {/* Clip photo to heart */}
        <clipPath id={`${ids.clip}`}>
          <path d={heartPath}/>
        </clipPath>
      </defs>

      {/* Frame shadow */}
      <g filter={`url(#${ids.shadow})`}>
        {/* Torn white paper border — slightly larger heart displaced */}
        <path
          d="M150 255 C150 255 4 163 4 68 C4 20 43 -2 82 10 C106 18 128 42 150 70 C172 42 194 18 218 10 C257 -2 296 20 296 68 C296 163 150 255 150 255Z"
          fill="white"
          filter={`url(#${ids.torn})`}
          opacity="0.97"
        />
      </g>

      {/* Photo clipped to heart */}
      {resolved && (
        <image
          href={resolved}
          x="0" y="0" width="300" height="260"
          clipPath={`url(#${ids.clip})`}
          preserveAspectRatio="xMidYMid slice"
        />
      )}

      {/* Placeholder when no photo */}
      {!resolved && (
        <g clipPath={`url(#${ids.clip})`}>
          <rect x="0" y="0" width="300" height="260" fill="#c8a070" opacity="0.5"/>
          <text x="150" y="130" textAnchor="middle" fill="rgba(100,60,20,0.4)"
            fontSize="14" fontFamily="Georgia,serif" fontStyle="italic">
            Add photo
          </text>
        </g>
      )}

      {/* Paper texture overlay on the torn border */}
      <path
        d="M150 255 C150 255 4 163 4 68 C4 20 43 -2 82 10 C106 18 128 42 150 70 C172 42 194 18 218 10 C257 -2 296 20 296 68 C296 163 150 255 150 255Z"
        fill="white"
        filter={`url(#${ids.paper})`}
        opacity="0.35"
      />
    </svg>
  );
}

/* ─── Realistic dried leaf (SVG with vein detail) ──────────────────── */
function DriedLeaf({ ids }) {
  return (
    <svg className="ch-leaf" viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id={`${ids.leafTex}`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="5" result="n"/>
          <feColorMatrix type="saturate" values="0" in="n" result="g"/>
          <feBlend in="SourceGraphic" in2="g" mode="multiply"/>
        </filter>
        <filter id={`${ids.leafShadow}`}>
          <feDropShadow dx="3" dy="5" stdDeviation="4" floodColor="rgba(30,40,0,0.3)"/>
        </filter>
      </defs>
      <g filter={`url(#${ids.leafShadow})`}>
        {/* Main large leaf — maple-like, dried olive green */}
        <path d="M100 160 C90 145 55 130 40 105 C25 80 30 50 50 36 C62 28 75 30 85 38 C90 30 95 15 100 8 C105 15 110 30 115 38 C125 30 138 28 150 36 C170 50 175 80 160 105 C145 130 110 145 100 160Z"
          fill="#7a8040" filter={`url(#${ids.leafTex})`} opacity="0.88"/>
        {/* Main midrib */}
        <path d="M100 155 L100 12" stroke="#4a5020" strokeWidth="1.4" opacity="0.7"/>
        {/* Primary veins */}
        {[
          "M100 120 Q75 110 55 100","M100 120 Q125 110 145 100",
          "M100 95  Q72  82 48  75", "M100 95  Q128 82 152 75",
          "M100 68  Q78  58 60  52", "M100 68  Q122 58 140 52",
          "M100 45  Q84  38 72  34", "M100 45  Q116 38 128 34",
        ].map((d,i) => <path key={i} d={d} stroke="#4a5020" strokeWidth="0.8" fill="none" opacity="0.6"/>)}
        {/* Secondary micro-veins */}
        {[
          "M78 108 Q68 104 60 102","M122 108 Q132 104 140 102",
          "M72 82  Q62 78  54 76", "M128 82  Q138 78  146 76",
          "M76 58  Q68 54  62 53", "M124 58  Q132 54  138 53",
        ].map((d,i) => <path key={i} d={d} stroke="#4a5020" strokeWidth="0.45" fill="none" opacity="0.45"/>)}
      </g>

      {/* Smaller leaf top-right — rotated, lighter hue */}
      <g transform="translate(130,10) rotate(30)" opacity="0.75" filter={`url(#${ids.leafShadow})`}>
        <path d="M35 100 C30 88 12 78 6 60 C0 42 5 24 16 16 C22 12 30 14 35 20 C40 14 48 12 54 16 C65 24 70 42 64 60 C58 78 40 88 35 100Z"
          fill="#8a9048" filter={`url(#${ids.leafTex})`}/>
        <path d="M35 96 L35 18" stroke="#4a5020" strokeWidth="1" opacity="0.65"/>
        {["M35 70 Q22 62 12 58","M35 70 Q48 62 58 58","M35 48 Q24 42 16 40","M35 48 Q46 42 54 40"].map((d,i)=>
          <path key={i} d={d} stroke="#4a5020" strokeWidth="0.7" fill="none" opacity="0.55"/>)}
      </g>

      {/* Stem */}
      <path d="M100 160 Q105 175 108 188" stroke="#6a6030" strokeWidth="2" fill="none" opacity="0.7"/>
    </svg>
  );
}

/* ─── Bougainvillea bouquet (SVG, layered petals) ──────────────────── */
function Bouquet({ ids }) {
  return (
    <svg className="ch-bouquet" viewBox="0 0 220 260" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id={`${ids.bougShadow}`}>
          <feDropShadow dx="2" dy="4" stdDeviation="5" floodColor="rgba(80,0,30,0.35)"/>
        </filter>
        <filter id={`${ids.petalTex}`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.6 0.4" numOctaves="2" seed="12" result="n"/>
          <feColorMatrix type="saturate" values="0" in="n" result="g"/>
          <feBlend in="SourceGraphic" in2="g" mode="screen" result="blend"/>
          <feComposite in="blend" in2="SourceGraphic" operator="in"/>
        </filter>
      </defs>
      {/* Stems */}
      {["M110 260 Q104 220 86 185","M110 260 Q116 215 140 178","M110 260 Q110 218 110 175",
        "M110 260 Q95 225 68 195","M110 260 Q126 222 155 192"].map((d,i)=>
        <path key={i} d={d} stroke="#3d5a1a" strokeWidth={2-i*0.2} fill="none"/>)}
      {/* Leaves */}
      <ellipse cx="94" cy="215" rx="15" ry="7" fill="#4a7a22" transform="rotate(-35 94 215)" opacity="0.85"/>
      <ellipse cx="128" cy="207" rx="13" ry="6" fill="#4a7a22" transform="rotate(25 128 207)" opacity="0.85"/>
      <ellipse cx="100" cy="200" rx="11" ry="5" fill="#5a8a28" transform="rotate(-15 100 200)" opacity="0.75"/>

      {/* Bracts — use realistic petal shapes with curves, not ellipses */}
      <g filter={`url(#${ids.bougShadow})`}>
        {/* Back layer */}
        {[
          {cx:70,cy:158,r1:20,r2:13,rot:-30,c:"#a81848"},
          {cx:148,cy:152,r1:19,r2:12,rot:25, c:"#b01c50"},
          {cx:55, cy:145,r1:17,r2:10,rot:-50,c:"#961440"},
        ].map(({cx,cy,r1,r2,rot,c},i)=>
          <ellipse key={i} cx={cx} cy={cy} rx={r1} ry={r2} fill={c}
            transform={`rotate(${rot} ${cx} ${cy})`} opacity="0.7"/>
        )}
        {/* Mid layer */}
        {[
          {cx:88, cy:148,r1:22,r2:15,rot:-20,c:"#c83060"},
          {cx:110,cy:140,r1:24,r2:16,rot:-5, c:"#d43868"},
          {cx:133,cy:146,r1:21,r2:14,rot:18, c:"#c02858"},
          {cx:68, cy:138,r1:18,r2:12,rot:-40,c:"#b82050"},
          {cx:152,cy:138,r1:18,r2:12,rot:35, c:"#b01848"},
        ].map(({cx,cy,r1,r2,rot,c},i)=>
          <ellipse key={i} cx={cx} cy={cy} rx={r1} ry={r2} fill={c}
            filter={`url(#${ids.petalTex})`} transform={`rotate(${rot} ${cx} ${cy})`}/>
        )}
        {/* Front bright layer */}
        {[
          {cx:95, cy:132,r1:20,r2:14,rot:-15,c:"#e04070"},
          {cx:122,cy:130,r1:22,r2:15,rot:10, c:"#d83868"},
          {cx:78, cy:128,r1:16,r2:11,rot:-35,c:"#c83060"},
          {cx:140,cy:128,r1:16,r2:11,rot:30, c:"#c02858"},
        ].map(({cx,cy,r1,r2,rot,c},i)=>
          <ellipse key={i} cx={cx} cy={cy} rx={r1} ry={r2} fill={c}
            filter={`url(#${ids.petalTex})`} transform={`rotate(${rot} ${cx} ${cy})`}/>
        )}
      </g>
      {/* Tiny flower centers */}
      {[[95,128],[122,126],[110,120]].map(([cx,cy],i)=>
        <circle key={i} cx={cx} cy={cy} r={4} fill="#f8e0ea" opacity="0.9"/>
      )}
      {/* Deep shadow base */}
      {[[80,162],[110,168],[140,162]].map(([cx,cy],i)=>
        <ellipse key={i} cx={cx} cy={cy} rx={16} ry={8} fill="#6a0828" opacity="0.4"/>
      )}
    </svg>
  );
}

/* ─── Spiral ring (realistic metal coil) ───────────────────────────── */
function SpiralRing({ ids, index }) {
  return (
    <div className="ch-ring" style={{ animationDelay: `${index * 0.04}s` }}>
      <svg viewBox="0 0 36 32" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`${ids.ring}${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#c8bfb0"/>
            <stop offset="25%"  stopColor="#8a8078"/>
            <stop offset="50%"  stopColor="#e8e0d0"/>
            <stop offset="75%"  stopColor="#6a6058"/>
            <stop offset="100%" stopColor="#b0a898"/>
          </linearGradient>
        </defs>
        {/* Ring body */}
        <ellipse cx="18" cy="16" rx="15" ry="11"
          fill="none"
          stroke={`url(#${ids.ring}${index})`}
          strokeWidth="4"
          style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))' }}
        />
        {/* Highlight arc — top */}
        <path d="M5 10 Q18 2 31 10"
          stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" fill="none"
          strokeLinecap="round"/>
        {/* Shadow arc — bottom */}
        <path d="M6 22 Q18 30 30 22"
          stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" fill="none"
          strokeLinecap="round"/>
        {/* Inner hole */}
        <ellipse cx="18" cy="16" rx="9" ry="6"
          fill="rgba(20,15,10,0.6)" stroke="rgba(0,0,0,0.4)" strokeWidth="0.5"/>
        {/* Coil overlap line */}
        <path d="M3 16 Q18 8 33 16"
          stroke="rgba(80,70,60,0.5)" strokeWidth="0.8" fill="none"/>
      </svg>
    </div>
  );
}

/* ─── The scrapbook page shadow (3-D page curl) ─────────────────────── */
function PageCurl() {
  return (
    <div className="ch-page-curl" aria-hidden="true">
      <svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="curlGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(180,150,100,0.9)"/>
            <stop offset="40%" stopColor="rgba(200,175,130,0.6)"/>
            <stop offset="100%" stopColor="rgba(140,110,70,0)"/>
          </linearGradient>
          <linearGradient id="curlShadow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.35)"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
          </linearGradient>
        </defs>
        {/* Curl surface */}
        <path d="M0 60 Q20 55 40 40 Q60 25 80 15 Q100 5 120 0 L120 20 Q90 25 65 38 Q40 50 20 58 Z"
          fill="url(#curlGrad)"/>
        {/* Shadow under curl */}
        <path d="M0 60 Q25 58 50 52 Q75 46 120 35 L120 40 Q75 50 50 56 Q25 60 0 60Z"
          fill="url(#curlShadow)" opacity="0.6"/>
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════ */
export default function CoverHero({
  name1, name2,
  photoSrc,
  titleWord1, titleWord2, subtitle,
  onChangeTitleWord1, onChangeTitleWord2, onChangeSubtitle,
  isEditing = false,
}) {
  // Stable IDs per instance
  const [ids] = useState(() => {
    const b = uid();
    return {
      paper: `${b}Paper`, torn: `${b}Torn`, shadow: `${b}Shadow`, clip: `${b}Clip`,
      leafTex: `${b}LeafTex`, leafShadow: `${b}LeafShadow`,
      bougShadow: `${b}BougShadow`, petalTex: `${b}PetalTex`,
      ring: `${b}Ring`,
    };
  });

  const canvasRef = useKraftCanvas();

  /* ── Entrance springs ── */
  const pageSpring = useSpring({
    from: { opacity: 0, transform: 'perspective(1200px) rotateY(-8deg) scale(0.97)' },
    to:   { opacity: 1, transform: 'perspective(1200px) rotateY(0deg)  scale(1)'    },
    config: { mass: 1.4, tension: 160, friction: 28 },
    delay: 80,
  });

  const heartSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(30px) rotate(4deg) scale(0.92)' },
    to:   { opacity: 1, transform: 'translateY(0px)  rotate(2deg) scale(1)'    },
    config: { mass: 1.2, tension: 140, friction: 22 },
    delay: 300,
  });

  const titleTrail = useTrail(2, {
    from: { opacity: 0, transform: 'translateX(-24px)' },
    to:   { opacity: 1, transform: 'translateX(0px)'   },
    config: { mass: 1, tension: 180, friction: 24 },
    delay: 200,
  });

  const subSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(12px)' },
    to:   { opacity: 1, transform: 'translateY(0px)'  },
    config: { tension: 160, friction: 22 },
    delay: 580,
  });

  const floatSpring = useSpring({
    from: { transform: 'translateY(0px)'  },
    to:   { transform: 'translateY(-6px)' },
    config: { mass: 2, tension: 55, friction: 18 },
    loop: { reverse: true },
  });

  const leafSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(-20px) rotate(8deg)' },
    to:   { opacity: 1, transform: 'translateY(0px)   rotate(8deg)' },
    config: { tension: 140, friction: 26 },
    delay: 150,
  });

  const bouquetSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(30px)' },
    to:   { opacity: 1, transform: 'translateY(0px)'  },
    config: { mass: 1.3, tension: 130, friction: 24 },
    delay: 420,
  });

  return (
    <animated.section
      className="ch-root"
      style={pageSpring}
      aria-label="Cover hero"
    >
      {/* Canvas kraft paper grain */}
      <canvas ref={canvasRef} className="ch-grain" aria-hidden="true"/>

      {/* Aging vignette overlay */}
      <div className="ch-vignette" aria-hidden="true"/>

      {/* BG override UI (edit mode) */}

      {/* Spiral spine — left column */}
      <div className="ch-spine" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <SpiralRing key={i} ids={ids} index={i}/>
        ))}
        {/* Spine edge highlight */}
        <div className="ch-spine-edge"/>
      </div>

      {/* Content area */}
      <div className="ch-content">

        {/* Headline block */}
        <div className="ch-headline">
          <animated.div style={titleTrail[0]} className="ch-our-row">
            <div className="ch-word-our-wrap">
              {/* Pink highlight box behind "r" */}
              <span className="ch-our-highlight" aria-hidden="true"/>
              <EditableText
                as="span" className="ch-word-our"
                value={titleWord1}
                isEditing={isEditing}
                onChange={onChangeTitleWord1}
              />
            </div>
          </animated.div>

          <animated.div style={titleTrail[1]} className="ch-anniv-row">
            <div className="ch-word-anniv-wrap">
              {/* The "0" circle ring overlay */}
              <span className="ch-zero-ring" aria-hidden="true"/>
              <EditableText
                as="span" className="ch-word-anniv"
                value={titleWord2}
                isEditing={isEditing}
                onChange={onChangeTitleWord2}
              />
            </div>
          </animated.div>
        </div>

        {/* Subtitle */}
        <animated.div style={subSpring}>
          <EditableText
            as="p" className="ch-subtitle" multiline
            value={subtitle}
            isEditing={isEditing}
            onChange={onChangeSubtitle}
          />
        </animated.div>

        {/* Play button */}
        <div className="ch-play-row">
          <button className="ch-play-btn" type="button" aria-label="Play">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Heart photo — floats */}
      <animated.div className="ch-heart-wrap" style={{ ...heartSpring }}>
        <animated.div style={floatSpring}>
          <HeartFrame photoSrc={photoSrc} ids={ids}/>
        </animated.div>
      </animated.div>

      {/* Dried leaf — top right */}
      <animated.div className="ch-leaf-wrap" style={leafSpring}>
        <DriedLeaf ids={ids}/>
      </animated.div>

      {/* Bouquet — bottom right */}
      <animated.div className="ch-bouquet-wrap" style={bouquetSpring}>
        <Bouquet ids={ids}/>
      </animated.div>

      {/* Page curl — bottom-left corner */}
      <PageCurl/>
    </animated.section>
  );
}
