import { useState, useEffect, useRef } from 'react';
import { EditableText } from './EditableField';
import { saveImage }   from '../utils/imageStore';
import { useImageUrl } from '../utils/useImageUrl';
import '../styles/components/MemoryGame.css';


const FALLBACK_PHOTOS = [
  { id: 'f1', url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&q=80' },
  { id: 'f2', url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80' },
  { id: 'f3', url: 'https://images.unsplash.com/photo-1516589091380-5d8e87df6999?w=400&q=80' },
  { id: 'f4', url: 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=400&q=80' },
  { id: 'f5', url: 'https://images.unsplash.com/photo-1596460107916-430662021049?w=400&q=80' },
  { id: 'f6', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80' },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildCards(photos) {
  const pool  = [...photos, ...FALLBACK_PHOTOS].slice(0, 6);
  const pairs = pool.flatMap((photo, idx) => [
    { cardId: `${idx}-a`, photoId: idx, url: photo.url, caption: photo.caption || '' },
    { cardId: `${idx}-b`, photoId: idx, url: photo.url, caption: photo.caption || '' },
  ]);
  return shuffle(pairs);
}


function CardImage({ url, className }) {
  const resolved = useImageUrl(url);
  return <img src={resolved || ''} alt="couple memory" className={className} draggable={false} decoding="async"/>;
}


function Card({ card, isFlipped, isMatched, onClick }) {
  return (
    <div
      className="mg-card-outer"
      onClick={onClick}
      style={{ cursor: isMatched ? 'default' : 'pointer' }}
    >
      <div className={[
        'mg-card-inner',
        isFlipped || isMatched ? 'mg-card-inner--flipped' : 'mg-card-inner--unflipped',
        isMatched ? 'mg-card-inner--matched' : 'mg-card-inner--unmatched',
      ].join(' ')}>
        <div className="mg-card-back">
          <span className="mg-card-back-icon">♥</span>
        </div>
        <div className={`mg-card-front ${isMatched ? 'mg-card-front--matched' : 'mg-card-front--unmatched'}`}>
          <CardImage url={card.url} className="mg-card-img"/>
          {isMatched && (
            <div className="mg-card-match-overlay">
              <svg width="20" height="18" viewBox="0 0 100 90" fill="#fff" opacity="0.9">
                <path d="M50 85 C50 85 5 55 5 28 C5 14 16 5 28 5 C37 5 45 10 50 18 C55 10 63 5 72 5 C84 5 95 14 95 28 C95 55 50 85 50 85Z" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


const FW_COLORS = [
  '#e91e8c', '#ff9ab5', '#d4a0ff', '#fff0f5',
  '#ff4d8d', '#c084fc', '#ffb3cc', '#f9a8d4',
  '#fde68a', '#ffffff',
];

function FireworkCanvas({ active }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const timers    = useRef([]);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = [];

    function spawnBurst(x, y, countOverride) {
      const count = countOverride ?? (50 + Math.floor(Math.random() * 20));
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
        const speed = 4.5 + Math.random() * 8;
        const size  = 3.5 + Math.random() * 5.5;
        const shape = Math.random();          
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color: FW_COLORS[Math.floor(Math.random() * FW_COLORS.length)],
          size,
          shape,
          rot:  Math.random() * Math.PI * 2,
          rotV: (Math.random() - 0.5) * 0.22,
          gravity: 0.10 + Math.random() * 0.08,
          drag: 0.965,
          twinkle: Math.random() > 0.6,
        });
      }
    }

    
    function spawnRain() {
      const x = Math.random() * canvas.width;
      const size = 2.5 + Math.random() * 3.5;
      particles.push({
        x, y: -10,
        vx: (Math.random() - 0.5) * 1.2,
        vy: 2 + Math.random() * 3.5,
        alpha: 0.9,
        color: FW_COLORS[Math.floor(Math.random() * FW_COLORS.length)],
        size,
        shape: Math.random() > 0.5 ? 0 : 0.6,   
        rot:  Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.12,
        gravity: 0.04,
        drag: 0.998,
        twinkle: true,
        rain: true,
      });
    }

    
    const origins = [
      [0.22, 0.25], [0.78, 0.22], [0.50, 0.16],
      [0.14, 0.52], [0.86, 0.48], [0.38, 0.36], [0.65, 0.30],
    ];
    origins.forEach(([rx, ry], i) => {
      const t = setTimeout(
        () => spawnBurst(canvas.width * rx, canvas.height * ry, 70),
        i * 140,
      );
      timers.current.push(t);
    });

    
    const burstTimer = setInterval(() => {
      spawnBurst(
        canvas.width  * (0.10 + Math.random() * 0.80),
        canvas.height * (0.08 + Math.random() * 0.55),
      );
    }, 320);
    const stopBurst = setTimeout(() => clearInterval(burstTimer), 3500);
    timers.current.push(stopBurst);

    
    const rainTimer = setInterval(spawnRain, 60);
    const stopRain  = setTimeout(() => clearInterval(rainTimer), 5000);
    timers.current.push(stopRain);

    
    function drawHeart(ctx, size) {
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.3);
      ctx.bezierCurveTo( size * 0.6, -size,  size * 1.1,  size * 0.3, 0,  size);
      ctx.bezierCurveTo(-size * 1.1,  size * 0.3, -size * 0.6, -size, 0, -size * 0.3);
      ctx.fill();
    }

    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      
      let writeIdx = 0;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.vx  *= p.drag;
        p.vy  *= p.drag;
        p.vy  += p.gravity;
        p.x   += p.vx;
        p.y   += p.vy;
        p.rot += p.rotV;

        
        if (p.rain) {
          if (p.y > canvas.height * 0.85) p.alpha -= 0.04;
        } else {
          p.alpha -= 0.011;
        }

        
        const displayAlpha = p.twinkle
          ? p.alpha * (0.75 + 0.25 * Math.sin(Date.now() * 0.012 + i))
          : p.alpha;

        if (displayAlpha <= 0 || p.y > canvas.height + 20) {
          continue; 
        }

        
        particles[writeIdx++] = p;

        ctx.save();
        ctx.globalAlpha = Math.max(0, displayAlpha);
        ctx.fillStyle   = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);

        if (p.shape < 0.5) {
          drawHeart(ctx, p.size);
        } else if (p.shape < 0.75) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.7, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        }
        ctx.restore();
      }
      particles.length = writeIdx;

      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      clearInterval(burstTimer);
      clearInterval(rainTimer);
      timers.current.forEach(clearTimeout);
      window.removeEventListener('resize', resize);
    };
  }, [active]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="mg-firework-canvas" aria-hidden="true" />;
}


function GiftBox({ onClick, opening, btnRef }) {
  return (
    <button
      ref={btnRef}
      className={`mg-gift-btn${opening ? ' mg-gift-btn--opening' : ''}`}
      onClick={!opening ? onClick : undefined}
      aria-label="Open your gift"
      title="Click to reveal your surprise"
      disabled={opening}
    >
      {}
      {!opening && <span className="mg-gift-pulse" aria-hidden="true" />}

      {}
      {opening && <span className="mg-gift-burst" aria-hidden="true" />}

      <svg
        className="mg-gift-svg"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="gBoxBody" x1="14" y1="52" x2="106" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#c0305a" />
            <stop offset="100%" stopColor="#8a1a3c" />
          </linearGradient>
          <linearGradient id="gBoxLid" x1="10" y1="40" x2="110" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#e0406e" />
            <stop offset="100%" stopColor="#b02850" />
          </linearGradient>
          <linearGradient id="gRibbon" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor="#ffd6e8" />
            <stop offset="100%" stopColor="#f48fb1" />
          </linearGradient>
          <linearGradient id="gBow" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor="#ff80ab" />
            <stop offset="100%" stopColor="#e91e8c" />
          </linearGradient>
          <linearGradient id="gBowInner" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor="#fce4ec" />
            <stop offset="100%" stopColor="#f48fb1" />
          </linearGradient>
        </defs>

        {}
        <rect x="14" y="52" width="92" height="58" rx="6" fill="url(#gBoxBody)" />
        {}
        <rect x="54" y="52" width="12" height="58" rx="3" fill="url(#gRibbon)" />
        {}
        <circle cx="28" cy="72" r="3" fill="rgba(255,255,255,0.35)" />
        <circle cx="90" cy="88" r="2.5" fill="rgba(255,255,255,0.25)" />

        {}
        <g
          className={`mg-gift-lid${opening ? ' mg-gift-lid--open' : ''}`}
          style={{ transformOrigin: '60px 58px' }}
        >
          {}
          <rect x="10" y="40" width="100" height="18" rx="5" fill="url(#gBoxLid)" />
          {}
          <rect x="10" y="46" width="100" height="12" rx="3" fill="url(#gRibbon)" />
          {}
          <ellipse cx="42" cy="30" rx="18" ry="12" fill="url(#gBow)" transform="rotate(-22 42 30)" />
          {}
          <ellipse cx="78" cy="30" rx="18" ry="12" fill="url(#gBow)" transform="rotate(22 78 30)" />
          {}
          <circle cx="60" cy="36" r="9" fill="url(#gBow)" />
          <circle cx="60" cy="36" r="5" fill="url(#gBowInner)" />
          {}
          <path d="M18 28 L20 22 L22 28 L28 26 L23 31 L25 37 L20 33 L15 37 L17 31 L12 26 Z"
            fill="rgba(255,220,240,0.55)" />
        </g>
      </svg>

      {!opening && <span className="mg-gift-label">Open your surprise</span>}
    </button>
  );
}


export default function MemoryGame({ couple, onComplete, isEditing = false, onContentChange }) {
  const gamePhotos = couple?.memoryGamePhotos?.filter(p => p?.url?.trim()).length
    ? couple.memoryGamePhotos.filter(p => p?.url?.trim())
    : null;
  const photos = gamePhotos ?? (couple?.photos?.length ? couple.photos : FALLBACK_PHOTOS);
  const name1  = couple?.name1 || 'You';

  const pc       = couple?.pageContent?.memoryGame || {};
  const eyebrow  = pc.eyebrow  ?? 'Mini game';
  const mgTitle  = pc.title    ?? "Let's play a little game";
  const subtitle = pc.subtitle ?? 'Find all matching pairs to unlock my Surprise';
  const hintTxt  = pc.hint     ?? 'Tap two cards to find matching pairs';
  const savePC   = (field, val) => onContentChange?.({ ...pc, [field]: val });

  
  const SLOTS = 6;
  const savedSlots = couple?.memoryGamePhotos || [];
  const fileRefs   = useRef(Array.from({ length: SLOTS }, () => null));

  const handleSlotFile = async (i, e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const key     = await saveImage(file);
      const updated = Array.from({ length: SLOTS }, (_, idx) => ({
        url:   savedSlots[idx]?.url   || '',
        label: savedSlots[idx]?.label || `Pair ${idx + 1}`,
      }));
      updated[i] = { ...updated[i], url: key };
      onContentChange?.({ ...pc, __memoryGamePhotos: updated });
    } catch (err) { console.error(err); }
    e.target.value = '';
  };

  const removeSlot = (i) => {
    const updated = Array.from({ length: SLOTS }, (_, idx) => ({
      url:   savedSlots[idx]?.url   || '',
      label: savedSlots[idx]?.label || `Pair ${idx + 1}`,
    }));
    updated[i] = { ...updated[i], url: '' };
    onContentChange?.({ ...pc, __memoryGamePhotos: updated });
  };

  
  const [cards]   = useState(() => buildCards(photos));
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves,   setMoves]   = useState(0);
  const [locked,  setLocked]  = useState(false);
  const [won,     setWon]     = useState(false);

  useEffect(() => {
    if (matched.length === 6 && !won) {
      setWon(true);
      setTimeout(() => onComplete?.(), 600);
    }
  }, [matched, won, onComplete]);

  function handleCardClick(index) {
    if (isEditing || locked) return;
    if (matched.includes(cards[index].photoId)) return;
    if (flipped.includes(index)) return;
    if (flipped.length === 2) return;
    const next = [...flipped, index];
    setFlipped(next);
    if (next.length === 2) {
      setMoves(m => m + 1);
      setLocked(true);
      const [a, b] = next;
      if (cards[a].photoId === cards[b].photoId) {
        setMatched(prev => [...prev, cards[a].photoId]);
        setFlipped([]);
        setLocked(false);
      } else {
        setTimeout(() => { setFlipped([]); setLocked(false); }, 900);
      }
    }
  }

  const isFlipped = (i) => flipped.includes(i);
  const isMatched = (i) => matched.includes(cards[i].photoId);

  return (
    <div className="mg-root">
      <div className="mg-panel">

        <EditableText as="div" className="mg-eyebrow"
          value={eyebrow} isEditing={isEditing} onChange={v => savePC('eyebrow', v)}/>
        <EditableText as="h2" className="mg-title"
          value={mgTitle} isEditing={isEditing} onChange={v => savePC('title', v)}/>
        <p className="mg-subtitle">
          <EditableText value={subtitle} isEditing={isEditing} onChange={v => savePC('subtitle', v)}/>
          {!isEditing && `, ${name1}!`}
        </p>

        {}
        {isEditing ? (
          <div className="mg-edit-slots">
            <p className="mg-edit-slots-label">
              Add up to 6 photos — each becomes a matching pair in the game
            </p>
            <div className="mg-edit-grid">
              {Array.from({ length: SLOTS }, (_, i) => (
                <SlotPicker
                  key={i}
                  index={i}
                  url={savedSlots[i]?.url || ''}
                  fileRef={el => { fileRefs.current[i] = el; }}
                  onPick={() => fileRefs.current[i]?.click()}
                  onRemove={() => removeSlot(i)}
                  onConfirm={(key) => {
                    const updated = Array.from({ length: SLOTS }, (_, idx) => ({
                      url:   savedSlots[idx]?.url   || '',
                      label: savedSlots[idx]?.label || `Pair ${idx + 1}`,
                    }));
                    updated[i] = { ...updated[i], url: key };
                    onContentChange?.({ ...pc, __memoryGamePhotos: updated });
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          
          <>
            <div className="mg-moves">Moves: {moves}</div>
            <div className="mg-grid">
              {cards.map((card, i) => (
                <Card
                  key={card.cardId}
                  card={card}
                  isFlipped={isFlipped(i)}
                  isMatched={isMatched(i)}
                  onClick={() => handleCardClick(i)}
                />
              ))}
            </div>
            <div className="mg-hearts">
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className={`mg-heart ${i < matched.length ? 'mg-heart--matched' : 'mg-heart--empty'}`}>
                  <svg width="18" height="16" viewBox="0 0 100 90">
                    <path d="M50 85 C50 85 5 55 5 28 C5 14 16 5 28 5 C37 5 45 10 50 18 C55 10 63 5 72 5 C84 5 95 14 95 28 C95 55 50 85 50 85Z"
                      fill={i < matched.length ? '#e91e8c' : 'rgba(255,150,180,0.2)'} />
                  </svg>
                </span>
              ))}
            </div>
            {won ? (
              <div className="mg-win">
                <div className="mg-win-icon">
                  <svg width="44" height="40" viewBox="0 0 100 90">
                    <path d="M50 85 C50 85 5 55 5 28 C5 14 16 5 28 5 C37 5 45 10 50 18 C55 10 63 5 72 5 C84 5 95 14 95 28 C95 55 50 85 50 85Z" fill="#e91e8c" />
                  </svg>
                </div>
                <p className="mg-win-text">
                  All pairs found in <strong className="mg-win-moves">{moves} moves</strong>!
                </p>
              </div>
            ) : (
              <EditableText as="p" className="mg-hint"
                value={hintTxt} isEditing={isEditing} onChange={v => savePC('hint', v)}/>
            )}
          </>
        )}
      </div>

      {!isEditing && (
        <button className="mg-skip" onClick={onComplete}></button>
      )}
    </div>
  );
}


function SlotPicker({ index, url, fileRef, onPick, onRemove, onConfirm }) {
  const resolved   = useImageUrl(url);
  const imgRef     = useRef(null);
  const zoomValRef = useRef(null);
  const translateRef = useRef({ x: 0, y: 0 });  
  const scaleRef   = useRef(1);
  const dragging   = useRef(false);
  const dragStart  = useRef({ mx: 0, my: 0, tx: 0, ty: 0 });

  const applyTransform = () => {
    if (!imgRef.current) return;
    const { x, y } = translateRef.current;
    imgRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scaleRef.current})`;
    if (zoomValRef.current) {
      zoomValRef.current.textContent = `${Math.round(scaleRef.current * 100)}%`;
    }
  };

  const onMouseDown = (e) => {
    if (!resolved) return;
    e.preventDefault(); e.stopPropagation();
    dragging.current = true;
    if (imgRef.current) imgRef.current.style.cursor = 'grabbing';
    dragStart.current = {
      mx: e.clientX, my: e.clientY,
      tx: translateRef.current.x, ty: translateRef.current.y,
    };

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
      if (imgRef.current) imgRef.current.style.cursor = 'grab';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const onWheel = (e) => {
    if (!resolved) return;
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault(); e.stopPropagation();
    scaleRef.current = Math.max(0.5, Math.min(4, parseFloat((scaleRef.current - e.deltaY * 0.002).toFixed(3))));
    applyTransform();
  };

  const zoom = (delta) => {
    scaleRef.current = Math.max(0.5, Math.min(4, parseFloat((scaleRef.current + delta).toFixed(3))));
    applyTransform();
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const key = await saveImage(file);
      translateRef.current = { x: 0, y: 0 };
      scaleRef.current = 1;
      onConfirm(key);
    } catch (err) { console.error(err); }
    e.target.value = '';
  };

  return (
    <div className="mg-slot">
      <div
        className={`mg-slot-img ${resolved ? 'mg-slot-img--filled' : ''}`}
        onClick={!resolved ? onPick : undefined}
        onWheel={resolved ? onWheel : undefined}
        title={resolved ? 'Drag to reposition · Scroll to zoom' : 'Click to add photo'}
      >
        {resolved ? (
          <>
            <img
              ref={imgRef}
              src={resolved}
              alt={`pair ${index + 1}`}
              style={{
                width:'100%', height:'100%', objectFit:'contain', display:'block',
                background:'#1a0a0e',
                transform: `translate(0px, 0px) scale(${scaleRef.current})`,
                transformOrigin: 'center center',
                cursor: 'grab',
              }}
              onMouseDown={onMouseDown}
              onDoubleClick={onPick}
              draggable={false}
            />
            {}
            <div className="mg-slot-zoom-btns" onClick={e => e.stopPropagation()}>
              <button className="mg-slot-zoom-btn" onMouseDown={e => { e.stopPropagation(); e.preventDefault(); zoom(0.1); }}>＋</button>
              <span ref={zoomValRef} className="mg-slot-zoom-val">100%</span>
              <button className="mg-slot-zoom-btn" onMouseDown={e => { e.stopPropagation(); e.preventDefault(); zoom(-0.1); }}>－</button>
            </div>
            <div className="mg-slot-drag-hint">✥ drag · ctrl+scroll · dbl-click to replace</div>
            <button
              className="mg-slot-remove"
              onClick={e => { e.stopPropagation(); onRemove(); }}
              title="Remove photo"
            >✕</button>
          </>
        ) : (
          <div className="mg-slot-empty">
            <span className="mg-slot-plus">+</span>
            <span className="mg-slot-pair-label">Pair {index + 1}</span>
          </div>
        )}
      </div>
      <input
        ref={fileRef}
        type="file" accept="image/*"
        style={{ display:'none' }}
        onChange={handleFile}
        onDoubleClick={resolved ? onPick : undefined}
      />
    </div>
  );
}
