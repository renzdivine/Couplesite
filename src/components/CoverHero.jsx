import { useEffect, useRef, useState } from 'react';
import { useSpring, useTrail, animated } from '@react-spring/web';
import { EditableText } from './EditableField';
import { useImageUrl }  from '../utils/useImageUrl';
import PositionDraggable from './PositionDraggable';
import '../styles/components/CoverHero.css';


let _uid = 0;
const uid = () => `ch${++_uid}`;


function useKraftCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    
    const run = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      
      const w = Math.round((parent ? parent.offsetWidth  || 1100 : 1100) / 2);
      const h = Math.round((parent ? parent.offsetHeight || 630  : 630)  / 2);
      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');

      
      ctx.fillStyle = '#c8a96e';
      ctx.fillRect(0, 0, w, h);

      
      for (let y = 0; y < h; y += 3) {
        const alpha = Math.random() * 0.06;
        ctx.strokeStyle = `rgba(${160 + Math.random()*40|0},${120+Math.random()*30|0},${60+Math.random()*20|0},${alpha})`;
        ctx.lineWidth = 1 + Math.random();
        ctx.beginPath();
        ctx.moveTo(0, y + Math.random());
        ctx.lineTo(w, y + Math.random());
        ctx.stroke();
      }

      
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 8) { 
        const n = (Math.random() - 0.5) * 24;
        d[i]   = Math.min(255, Math.max(0, d[i]   + n));
        d[i+1] = Math.min(255, Math.max(0, d[i+1] + n * 0.8));
        d[i+2] = Math.min(255, Math.max(0, d[i+2] + n * 0.5));
      }
      ctx.putImageData(imgData, 0, 0);

      
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


function HeartFrame({ photoSrc, ids, isEditing, onReplace, onRemove, zoomRef, photoData, onTransformChange }) {
  const resolved = useImageUrl(photoSrc);
  const fileRef  = useRef(null);
  const imgRef   = useRef(null);

  // Initialise from saved data so zoom/pan survives refresh
  const savedX     = photoData?.translateX ?? 0;
  const savedY     = photoData?.translateY ?? 0;
  const savedScale = photoData?.scale      ?? 1;

  const translateRef = useRef({ x: savedX, y: savedY });
  const scaleRef     = useRef(savedScale);
  const dragging     = useRef(false);
  const dragStart    = useRef({ mx: 0, my: 0, tx: 0, ty: 0 });

  // Restore saved transform when photoData first arrives (async load)
  useEffect(() => {
    if (dragging.current) return;
    translateRef.current = { x: savedX, y: savedY };
    scaleRef.current = savedScale;
    applyTransform();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedX, savedY, savedScale]);

  // Re-apply when image URL resolves
  useEffect(() => {
    if (resolved) applyTransform();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = '';
    const { saveImage } = await import('../utils/imageStore');
    const key = await saveImage(file);
    translateRef.current = { x: 0, y: 0 };
    scaleRef.current = 1;
    onTransformChange?.({ translateX: 0, translateY: 0, scale: 1 });
    onReplace?.(key);
  };

  const applyTransform = () => {
    if (!imgRef.current) return;
    const { x, y } = translateRef.current;
    const s = scaleRef.current;
    imgRef.current.setAttribute('transform',
      `translate(${150 + x}, ${130 + y}) scale(${s}) translate(-150, -130)`
    );
  };

  const saveTransform = () => {
    onTransformChange?.({
      translateX: translateRef.current.x,
      translateY: translateRef.current.y,
      scale: scaleRef.current,
    });
  };

  const onMouseDown = (e) => {
    if (!isEditing || !resolved) return;
    e.preventDefault(); e.stopPropagation();
    dragging.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, tx: translateRef.current.x, ty: translateRef.current.y };
    const onMove = (mv) => {
      if (!dragging.current) return;
      translateRef.current = {
        x: dragStart.current.tx + (mv.clientX - dragStart.current.mx),
        y: dragStart.current.ty + (mv.clientY - dragStart.current.my),
      };
      applyTransform();
    };
    const onUp = () => {
      dragging.current = false;
      saveTransform();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const zoom = (delta) => {
    scaleRef.current = Math.max(0.5, Math.min(4, parseFloat((scaleRef.current + delta).toFixed(3))));
    applyTransform();
    saveTransform();
  };

  if (zoomRef) zoomRef.current = zoom;

  const onWheel = (e) => {
    if (!isEditing || !resolved) return;
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault(); e.stopPropagation();
    zoom(e.deltaY < 0 ? 0.05 : -0.05);
  };

  const heartPath = "M150 250 C150 250 10 158 10 72 C10 28 46 6 82 16 C104 22 128 44 150 70 C172 44 196 22 218 16 C254 6 290 28 290 72 C290 158 150 250 150 250Z";
  return (
    <>
      <svg
        className="ch-heart-svg"
        viewBox="0 0 300 260"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        onWheel={onWheel}
        style={{ cursor: isEditing && resolved ? 'grab' : undefined, overflow: 'visible' }}
      >
        <defs>
          <filter id={`${ids.paper}`} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9 0.65" numOctaves="2" seed="8" result="noise"/>
            <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise"/>
            <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="blend"/>
            <feComposite in="blend" in2="SourceGraphic" operator="in"/>
          </filter>
          <filter id={`${ids.torn}`} x="-8%" y="-8%" width="116%" height="116%">
            <feTurbulence type="turbulence" baseFrequency="0.045 0.06" numOctaves="3" seed="42" result="turb"/>
            <feDisplacementMap in="SourceGraphic" in2="turb" scale="14" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
          <filter id={`${ids.shadow}`} x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="6" dy="10" stdDeviation="12" floodColor="rgba(40,20,0,0.45)"/>
          </filter>
          <clipPath id={`${ids.clip}`}>
            <path d={heartPath}/>
          </clipPath>
        </defs>

        {}
        <g filter={`url(#${ids.shadow})`}>
          <path
            d="M150 255 C150 255 4 163 4 68 C4 20 43 -2 82 10 C106 18 128 42 150 70 C172 42 194 18 218 10 C257 -2 296 20 296 68 C296 163 150 255 150 255Z"
            fill="white"
            filter={`url(#${ids.torn})`}
            opacity="0.97"
          />
        </g>

        {}
        {resolved && (
          <g clipPath={`url(#${ids.clip})`}>
            <image
              ref={imgRef}
              href={resolved}
              x="0" y="0" width="300" height="260"
              preserveAspectRatio="xMidYMid meet"
              transform={`translate(${150 + translateRef.current.x}, ${130 + translateRef.current.y}) scale(${scaleRef.current}) translate(-150, -130)`}
              onMouseDown={onMouseDown}
              onDoubleClick={isEditing ? () => fileRef.current?.click() : undefined}
              style={{ cursor: isEditing ? 'grab' : undefined }}
            />
          </g>
        )}

        {}
        {!resolved && (
          <g
            clipPath={`url(#${ids.clip})`}
            onDoubleClick={isEditing ? () => fileRef.current?.click() : undefined}
            style={{ cursor: isEditing ? 'pointer' : undefined }}
          >
            <rect x="0" y="0" width="300" height="260" fill={isEditing ? 'rgba(220,180,190,0.9)' : '#c9adb5'}/>
            {isEditing ? (
              <>
                <circle cx="150" cy="120" r="28" fill="none" stroke="rgba(233,30,140,0.7)" strokeWidth="2" strokeDasharray="5 3"/>
                <line x1="150" y1="104" x2="150" y2="136" stroke="rgba(233,30,140,0.95)" strokeWidth="3" strokeLinecap="round"/>
                <line x1="134" y1="120" x2="166" y2="120" stroke="rgba(233,30,140,0.95)" strokeWidth="3" strokeLinecap="round"/>
                <text x="150" y="162" textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="11" fontWeight="700" fill="rgba(100,40,60,0.9)" letterSpacing="0.05em">DBL-CLICK TO ADD</text>
              </>
            ) : (
              <g transform="translate(136, 118)">
                <path d="M14 0L12 3H7a2 2 0 00-2 2v11a2 2 0 002 2h22a2 2 0 002-2V5a2 2 0 00-2-2h-5l-2-3H14z"
                  stroke="rgba(120,85,95,0.55)" strokeWidth="1.4" fill="rgba(180,140,150,0.25)" strokeLinejoin="round"/>
                <circle cx="18" cy="11" r="4" stroke="rgba(120,85,95,0.55)" strokeWidth="1.4" fill="none"/>
                <circle cx="18" cy="11" r="1.5" fill="rgba(120,85,95,0.4)"/>
              </g>
            )}
          </g>
        )}

        {}
        <path
          d="M150 255 C150 255 4 163 4 68 C4 20 43 -2 82 10 C106 18 128 42 150 70 C172 42 194 18 218 10 C257 -2 296 20 296 68 C296 163 150 255 150 255Z"
          fill="white"
          filter={`url(#${ids.paper})`}
          opacity="0.35"
          style={{ pointerEvents: 'none' }}
        />
      </svg>
      {isEditing && <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile}/>}
    </>
  );
}


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
        {}
        <path d="M100 160 C90 145 55 130 40 105 C25 80 30 50 50 36 C62 28 75 30 85 38 C90 30 95 15 100 8 C105 15 110 30 115 38 C125 30 138 28 150 36 C170 50 175 80 160 105 C145 130 110 145 100 160Z"
          fill="#7a8040" filter={`url(#${ids.leafTex})`} opacity="0.88"/>
        {}
        <path d="M100 155 L100 12" stroke="#4a5020" strokeWidth="1.4" opacity="0.7"/>
        {}
        {[
          "M100 120 Q75 110 55 100","M100 120 Q125 110 145 100",
          "M100 95  Q72  82 48  75", "M100 95  Q128 82 152 75",
          "M100 68  Q78  58 60  52", "M100 68  Q122 58 140 52",
          "M100 45  Q84  38 72  34", "M100 45  Q116 38 128 34",
        ].map((d,i) => <path key={i} d={d} stroke="#4a5020" strokeWidth="0.8" fill="none" opacity="0.6"/>)}
        {}
        {[
          "M78 108 Q68 104 60 102","M122 108 Q132 104 140 102",
          "M72 82  Q62 78  54 76", "M128 82  Q138 78  146 76",
          "M76 58  Q68 54  62 53", "M124 58  Q132 54  138 53",
        ].map((d,i) => <path key={i} d={d} stroke="#4a5020" strokeWidth="0.45" fill="none" opacity="0.45"/>)}
      </g>

      {}
      <g transform="translate(130,10) rotate(30)" opacity="0.75" filter={`url(#${ids.leafShadow})`}>
        <path d="M35 100 C30 88 12 78 6 60 C0 42 5 24 16 16 C22 12 30 14 35 20 C40 14 48 12 54 16 C65 24 70 42 64 60 C58 78 40 88 35 100Z"
          fill="#8a9048" filter={`url(#${ids.leafTex})`}/>
        <path d="M35 96 L35 18" stroke="#4a5020" strokeWidth="1" opacity="0.65"/>
        {["M35 70 Q22 62 12 58","M35 70 Q48 62 58 58","M35 48 Q24 42 16 40","M35 48 Q46 42 54 40"].map((d,i)=>
          <path key={i} d={d} stroke="#4a5020" strokeWidth="0.7" fill="none" opacity="0.55"/>)}
      </g>

      {}
      <path d="M100 160 Q105 175 108 188" stroke="#6a6030" strokeWidth="2" fill="none" opacity="0.7"/>
    </svg>
  );
}


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
      {}
      {["M110 260 Q104 220 86 185","M110 260 Q116 215 140 178","M110 260 Q110 218 110 175",
        "M110 260 Q95 225 68 195","M110 260 Q126 222 155 192"].map((d,i)=>
        <path key={i} d={d} stroke="#3d5a1a" strokeWidth={2-i*0.2} fill="none"/>)}
      {}
      <ellipse cx="94" cy="215" rx="15" ry="7" fill="#4a7a22" transform="rotate(-35 94 215)" opacity="0.85"/>
      <ellipse cx="128" cy="207" rx="13" ry="6" fill="#4a7a22" transform="rotate(25 128 207)" opacity="0.85"/>
      <ellipse cx="100" cy="200" rx="11" ry="5" fill="#5a8a28" transform="rotate(-15 100 200)" opacity="0.75"/>

      {}
      <g filter={`url(#${ids.bougShadow})`}>
        {}
        {[
          {cx:70,cy:158,r1:20,r2:13,rot:-30,c:"#a81848"},
          {cx:148,cy:152,r1:19,r2:12,rot:25, c:"#b01c50"},
          {cx:55, cy:145,r1:17,r2:10,rot:-50,c:"#961440"},
        ].map(({cx,cy,r1,r2,rot,c},i)=>
          <ellipse key={i} cx={cx} cy={cy} rx={r1} ry={r2} fill={c}
            transform={`rotate(${rot} ${cx} ${cy})`} opacity="0.7"/>
        )}
        {}
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
        {}
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
      {}
      {[[95,128],[122,126],[110,120]].map(([cx,cy],i)=>
        <circle key={i} cx={cx} cy={cy} r={4} fill="#f8e0ea" opacity="0.9"/>
      )}
      {}
      {[[80,162],[110,168],[140,162]].map(([cx,cy],i)=>
        <ellipse key={i} cx={cx} cy={cy} rx={16} ry={8} fill="#6a0828" opacity="0.4"/>
      )}
    </svg>
  );
}


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
        {}
        <ellipse cx="18" cy="16" rx="15" ry="11"
          fill="none"
          stroke={`url(#${ids.ring}${index})`}
          strokeWidth="4"
          style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))' }}
        />
        {}
        <path d="M5 10 Q18 2 31 10"
          stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" fill="none"
          strokeLinecap="round"/>
        {}
        <path d="M6 22 Q18 30 30 22"
          stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" fill="none"
          strokeLinecap="round"/>
        {}
        <ellipse cx="18" cy="16" rx="9" ry="6"
          fill="rgba(20,15,10,0.6)" stroke="rgba(0,0,0,0.4)" strokeWidth="0.5"/>
        {}
        <path d="M3 16 Q18 8 33 16"
          stroke="rgba(80,70,60,0.5)" strokeWidth="0.8" fill="none"/>
      </svg>
    </div>
  );
}


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
        {}
        <path d="M0 60 Q20 55 40 40 Q60 25 80 15 Q100 5 120 0 L120 20 Q90 25 65 38 Q40 50 20 58 Z"
          fill="url(#curlGrad)"/>
        {}
        <path d="M0 60 Q25 58 50 52 Q75 46 120 35 L120 40 Q75 50 50 56 Q25 60 0 60Z"
          fill="url(#curlShadow)" opacity="0.6"/>
      </svg>
    </div>
  );
}


export default function CoverHero({
  name1, name2,
  photoSrc,
  photoData,
  titleWord1, titleWord2, subtitle,
  onChangeTitleWord1, onChangeTitleWord2, onChangeSubtitle,
  // Persisted styles for text elements (from Supabase via pageContent)
  titleWord1Style = {}, titleWord2Style = {}, subtitleStyle = {},
  onStyleSaveTitleWord1, onStyleSaveTitleWord2, onStyleSaveSubtitle,
  isEditing = false,
  onReplacePhoto,
  onRemovePhoto,
  onTransformChange,
  // Free-move positions for each decoration
  positions = {},          // { heart, leaf, bouquet } — each { offsetX, offsetY }
  onPositionChange,        // (key, { offsetX, offsetY }) => void
}) {
  
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
  const heartZoomRef = useRef(null);

  
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
      {}
      <canvas ref={canvasRef} className="ch-grain" aria-hidden="true"/>

      {}
      <div className="ch-vignette" aria-hidden="true"/>

      {}

      {}
      <div className="ch-spine" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <SpiralRing key={i} ids={ids} index={i}/>
        ))}
        {}
        <div className="ch-spine-edge"/>
      </div>

      {}
      <div className="ch-content">

        {}
        <div className="ch-headline">
          <animated.div style={titleTrail[0]} className="ch-our-row">
            <div className="ch-word-our-wrap">
              {}
              <span className="ch-our-highlight" aria-hidden="true"/>
              <PositionDraggable
                id="cover-title1"
                isEditing={isEditing}
                offsetX={positions?.title1?.offsetX ?? 0}
                offsetY={positions?.title1?.offsetY ?? 0}
                width={positions?.title1?.width ?? null}
                height={positions?.title1?.height ?? null}
                rotation={positions?.title1?.rotation ?? 0}
                onPositionChange={(_, pos) => onPositionChange?.('title1', pos)}
                label="Move Text"
                className="pd-inline"
              >
                <EditableText
                  as="span" className="ch-word-our"
                  value={titleWord1}
                  isEditing={isEditing}
                  onChange={onChangeTitleWord1}
                  style={titleWord1Style}
                  onStyleSave={onStyleSaveTitleWord1}
                />
              </PositionDraggable>
            </div>
          </animated.div>

          <animated.div style={titleTrail[1]} className="ch-anniv-row">
            <div className="ch-word-anniv-wrap">
              {}
              <span className="ch-zero-ring" aria-hidden="true"/>
              <PositionDraggable
                id="cover-title2"
                isEditing={isEditing}
                offsetX={positions?.title2?.offsetX ?? 0}
                offsetY={positions?.title2?.offsetY ?? 0}
                width={positions?.title2?.width ?? null}
                height={positions?.title2?.height ?? null}
                rotation={positions?.title2?.rotation ?? 0}
                onPositionChange={(_, pos) => onPositionChange?.('title2', pos)}
                label="Move Text"
                className="pd-inline"
              >
                <EditableText
                  as="span" className="ch-word-anniv"
                  value={titleWord2}
                  isEditing={isEditing}
                  onChange={onChangeTitleWord2}
                  style={titleWord2Style}
                  onStyleSave={onStyleSaveTitleWord2}
                />
              </PositionDraggable>
            </div>
          </animated.div>
        </div>

        {}
        <animated.div style={subSpring}>
          <PositionDraggable
            id="cover-subtitle"
            isEditing={isEditing}
            offsetX={positions?.subtitle?.offsetX ?? 0}
            offsetY={positions?.subtitle?.offsetY ?? 0}
            width={positions?.subtitle?.width ?? null}
            height={positions?.subtitle?.height ?? null}
            rotation={positions?.subtitle?.rotation ?? 0}
            onPositionChange={(_, pos) => onPositionChange?.('subtitle', pos)}
            label="Move Text"
            className="pd-inline"
          >
            <EditableText
              as="p" className="ch-subtitle" multiline
              value={subtitle}
              isEditing={isEditing}
              onChange={onChangeSubtitle}
              style={subtitleStyle}
              onStyleSave={onStyleSaveSubtitle}
            />
          </PositionDraggable>
        </animated.div>

      </div>

      {}
      <animated.div className="ch-heart-wrap" style={{ ...heartSpring }}>
        <PositionDraggable
          id="cover-heart"
          isEditing={isEditing}
          offsetX={positions?.heart?.offsetX ?? 0}
          offsetY={positions?.heart?.offsetY ?? 0}
          width={positions?.heart?.width ?? null}
          height={positions?.heart?.height ?? null} rotation={positions?.heart?.rotation ?? 0}
          onPositionChange={(id, pos) => onPositionChange?.('heart', pos)}
          label="Move Heart"
        >
          <animated.div className="ch-heart-float-wrap" style={floatSpring}>
            <div className="ch-heart-inner" style={{ position: 'relative', display: 'inline-block' }}>
              <HeartFrame photoSrc={photoSrc} ids={ids} isEditing={isEditing} onReplace={onReplacePhoto} onRemove={onRemovePhoto} zoomRef={heartZoomRef} photoData={photoData} onTransformChange={onTransformChange}/>
              {isEditing && photoSrc && (
                <>
                  {}
                  <div style={{
                    position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'rgba(10,0,20,0.75)', border: '1px solid rgba(233,30,140,0.35)',
                    borderRadius: 20, padding: '3px 8px', zIndex: 10, whiteSpace: 'nowrap',
                  }}>
                    <button onMouseDown={e => { e.stopPropagation(); e.preventDefault(); heartZoomRef.current?.(0.1); }}
                      style={{ background:'none', border:'none', color:'#ff9ab5', fontSize:'0.9rem', cursor:'pointer', padding:'0 3px', fontFamily:'system-ui,sans-serif' }}>＋</button>
                    <span style={{ fontSize:'0.6rem', color:'rgba(255,180,200,0.7)', fontFamily:'system-ui,sans-serif', minWidth:28, textAlign:'center' }}>zoom</span>
                    <button onMouseDown={e => { e.stopPropagation(); e.preventDefault(); heartZoomRef.current?.(-0.1); }}
                      style={{ background:'none', border:'none', color:'#ff9ab5', fontSize:'0.9rem', cursor:'pointer', padding:'0 3px', fontFamily:'system-ui,sans-serif' }}>－</button>
                  </div>
                  {}
                  <div style={{
                    position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)',
                    fontSize: '0.55rem', color: 'rgba(255,200,220,0.8)', background: 'rgba(10,0,20,0.65)',
                    padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap', pointerEvents: 'none',
                    fontFamily: 'system-ui,sans-serif', zIndex: 10,
                  }}>✥ drag · ctrl+scroll · dbl-click to replace</div>
                  {}
                  <button
                    onClick={() => onRemovePhoto?.()}
                    title="Remove photo"
                    style={{
                      position: 'absolute', top: 8, right: 8,
                      width: 24, height: 24, borderRadius: '50%', border: 'none',
                      background: 'rgba(140,10,30,0.9)', color: '#fce8ea',
                      fontSize: '0.7rem', cursor: 'pointer', zIndex: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >✕</button>
                </>
              )}
            </div>
          </animated.div>
        </PositionDraggable>
      </animated.div>

      {}
      <animated.div className="ch-leaf-wrap" style={leafSpring}>
        <PositionDraggable
          id="cover-leaf"
          isEditing={isEditing}
          offsetX={positions?.leaf?.offsetX ?? 0}
          offsetY={positions?.leaf?.offsetY ?? 0}
          width={positions?.leaf?.width ?? null}
          height={positions?.leaf?.height ?? null} rotation={positions?.leaf?.rotation ?? 0}
          onPositionChange={(id, pos) => onPositionChange?.('leaf', pos)}
          label="Move Leaf"
        >
          <DriedLeaf ids={ids}/>
        </PositionDraggable>
      </animated.div>

      {}
      <animated.div className="ch-bouquet-wrap" style={bouquetSpring}>
        <PositionDraggable
          id="cover-bouquet"
          isEditing={isEditing}
          offsetX={positions?.bouquet?.offsetX ?? 0}
          offsetY={positions?.bouquet?.offsetY ?? 0}
          width={positions?.bouquet?.width ?? null}
          height={positions?.bouquet?.height ?? null} rotation={positions?.bouquet?.rotation ?? 0}
          onPositionChange={(id, pos) => onPositionChange?.('bouquet', pos)}
          label="Move Bouquet"
        >
          <Bouquet ids={ids}/>
        </PositionDraggable>
      </animated.div>

      {}
      <PageCurl/>
    </animated.section>
  );
}
