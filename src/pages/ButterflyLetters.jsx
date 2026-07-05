import { useState, useEffect, useRef, useCallback, memo, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { EditableText } from '../components/EditableField';
import { saveImage } from '../utils/imageStore';
import { useImageUrl } from '../utils/useImageUrl';
import CoverHero from '../components/CoverHero';
import '../styles/pages/ButterflyLetters.css';

/* ─── DraggablePhoto — drag to pan, ctrl+scroll to zoom, ✕ to remove ── */
function DraggablePhoto({ src, alt = '', className = '', style = {}, isEditing = false, onReplace, onRemove, objectFit = 'contain', onTransformChange, photoData }) {
  const resolved     = useImageUrl(src);
  const imgRef       = useRef(null);
  const fileRef      = useRef(null);
  const zoomValRef   = useRef(null);
  const translateRef = useRef({ x: photoData?.translateX || 0, y: photoData?.translateY || 0 });
  const scaleRef     = useRef(photoData?.scale || 1);
  const dragging     = useRef(false);
  const dragStart    = useRef({ mx: 0, my: 0, tx: 0, ty: 0 });

  const prevSrc = useRef(src);
  if (src !== prevSrc.current) {
    prevSrc.current = src;
    translateRef.current = { x: photoData?.translateX || 0, y: photoData?.translateY || 0 };
    scaleRef.current = photoData?.scale || 1;
  }

  const applyTransform = useCallback(() => {
    if (!imgRef.current) return;
    const { x, y } = translateRef.current;
    imgRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scaleRef.current})`;
    if (zoomValRef.current) {
      zoomValRef.current.textContent = `${Math.round(scaleRef.current * 100)}%`;
    }
  }, []);

  // Apply saved transform on mount and when data changes
  useEffect(() => {
    if (photoData) {
      translateRef.current = { x: photoData.translateX || 0, y: photoData.translateY || 0 };
      scaleRef.current = photoData.scale || 1;
      applyTransform();
    }
  }, [photoData, applyTransform]);

  const saveTransform = useCallback(() => {
    if (onTransformChange) {
      onTransformChange({
        translateX: translateRef.current.x,
        translateY: translateRef.current.y,
        scale: scaleRef.current
      });
    }
  }, [onTransformChange]);

  const onMouseDown = useCallback((e) => {
    if (!isEditing || !resolved) return;
    e.preventDefault(); e.stopPropagation();
    dragging.current = true;
    if (imgRef.current) imgRef.current.style.cursor = 'grabbing';
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
      if (imgRef.current) imgRef.current.style.cursor = 'grab';
      saveTransform();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [isEditing, resolved, applyTransform, saveTransform]);

  const onWheel = useCallback((e) => {
    if (!isEditing || !resolved) return;
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault(); e.stopPropagation();
    scaleRef.current = Math.max(0.5, Math.min(4, parseFloat((scaleRef.current - e.deltaY * 0.002).toFixed(3))));
    applyTransform();
    saveTransform();
  }, [isEditing, resolved, applyTransform, saveTransform]);

  const zoom = (delta) => {
    scaleRef.current = Math.max(0.5, Math.min(4, parseFloat((scaleRef.current + delta).toFixed(3))));
    applyTransform();
    saveTransform();
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = '';
    const key = await saveImage(file);
    translateRef.current = { x: 0, y: 0 };
    scaleRef.current = 1;
    onReplace?.(key);
  };

  const isDraggable = isEditing && !!resolved;

  if (!isEditing && !resolved) {
    return (
      <div style={{ background: '#c9adb5', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>
        <svg width="28" height="24" viewBox="0 0 28 24" fill="none"><path d="M10 4L8 7H3a2 2 0 00-2 2v11a2 2 0 002 2h22a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-3H10z" stroke="rgba(120,85,95,0.55)" strokeWidth="1.4" fill="rgba(180,140,150,0.18)" strokeLinejoin="round"/><circle cx="14" cy="14" r="4" stroke="rgba(120,85,95,0.55)" strokeWidth="1.4" fill="none"/><circle cx="14" cy="14" r="1.5" fill="rgba(120,85,95,0.4)"/></svg>
      </div>
    );
  }

  if (!isEditing && resolved) {
    return <img src={resolved} alt={alt} className={className} style={{ width: '100%', height: '100%', objectFit: objectFit, display: 'block', background: '#1a0a0e', ...style }} loading="lazy" decoding="async"/>;
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...style }}
      onWheel={isDraggable ? onWheel : undefined}
    >
      {resolved ? (
        <>
          <img
            ref={imgRef}
            src={resolved} alt={alt} className={className}
            style={{ width: '100%', height: '100%', objectFit: objectFit, display: 'block', background: '#1a0a0e', transform: 'translate(0px,0px) scale(1)', transformOrigin: 'center center', cursor: 'grab' }}
            onMouseDown={onMouseDown}
            onDoubleClick={() => fileRef.current?.click()}
            draggable={false}
          />
          {/* zoom controls */}
          <div className="bl-dp-zoom-btns" onClick={e => e.stopPropagation()}>
            <button className="bl-dp-zoom-btn" onMouseDown={e => { e.stopPropagation(); e.preventDefault(); zoom(0.1); }}>＋</button>
            <span ref={zoomValRef} className="bl-dp-zoom-val">100%</span>
            <button className="bl-dp-zoom-btn" onMouseDown={e => { e.stopPropagation(); e.preventDefault(); zoom(-0.1); }}>－</button>
          </div>
          <div className="bl-dp-drag-hint">✥ drag · ctrl+scroll · dbl-click to replace</div>
          {/* remove button */}
          <button className="bl-dp-remove-btn" onClick={e => { e.stopPropagation(); onRemove?.(); }} title="Remove photo">✕</button>
        </>
      ) : (
        <div
          className="bl-dp-placeholder"
          onClick={() => fileRef.current?.click()}
          title="Click to add photo"
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
            <circle cx="18" cy="18" r="17" fill="rgba(233,30,140,0.15)" stroke="rgba(233,30,140,0.7)" strokeWidth="1.8" strokeDasharray="4 3"/>
            <line x1="18" y1="10" x2="18" y2="26" stroke="rgba(233,30,140,1)" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="10" y1="18" x2="26" y2="18" stroke="rgba(233,30,140,1)" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: '0.6rem', fontFamily: 'system-ui,sans-serif', color: 'rgba(233,30,140,0.9)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>Click to add</span>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile}/>
    </div>
  );
}

/* ─── Error boundary — catches any render crash ─────────────── */
class BookErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { crashed: false, error: null }; }
  static getDerivedStateFromError(error) { return { crashed: true, error }; }
  componentDidCatch(error, info) { console.error('[ButterflyLetters crash]', error, info); }
  render() {
    if (this.state.crashed) {
      return (
        <div style={{ position:'fixed', inset:0, background:'#1a0a06', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, color:'#e0c090', fontFamily:'Georgia,serif' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p style={{ fontSize:18, margin:0 }}>Something went wrong loading the book.</p>
          <button onClick={() => this.setState({ crashed: false })}
            style={{ background:'rgba(200,150,80,0.2)', border:'1px solid rgba(200,150,80,0.4)', color:'#e0c090', padding:'8px 20px', borderRadius:8, cursor:'pointer', fontSize:14 }}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─── Photo component ───────────────────────────────────────── */
function PhotoPlaceholder({ className = '', style = {}, isEditing = false }) {
  return (
    <div className={`bl-photo bl-photo-empty ${className}`} style={{ background: '#c9adb5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, ...style }}>
      {isEditing ? (
        <>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="16" cy="16" r="15" fill="rgba(233,30,140,0.18)" stroke="rgba(233,30,140,0.6)" strokeWidth="1.5" strokeDasharray="4 3"/>
            <line x1="16" y1="9" x2="16" y2="23" stroke="rgba(233,30,140,0.9)" strokeWidth="2" strokeLinecap="round"/>
            <line x1="9" y1="16" x2="23" y2="16" stroke="rgba(233,30,140,0.9)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: '0.6rem', fontFamily: 'system-ui,sans-serif', color: 'rgba(120,50,70,0.85)', fontWeight: 600, textAlign: 'center', lineHeight: 1.3, padding: '0 6px' }}>Add Photo</span>
        </>
      ) : (
        <svg width="28" height="24" viewBox="0 0 28 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect width="28" height="24" rx="3" fill="rgba(255,255,255,0.0)"/>
          <path d="M10 4L8 7H3a2 2 0 00-2 2v11a2 2 0 002 2h22a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-3H10z" stroke="rgba(120,85,95,0.55)" strokeWidth="1.4" fill="rgba(180,140,150,0.18)" strokeLinejoin="round"/>
          <circle cx="14" cy="14" r="4" stroke="rgba(120,85,95,0.55)" strokeWidth="1.4" fill="none"/>
          <circle cx="14" cy="14" r="1.5" fill="rgba(120,85,95,0.4)"/>
        </svg>
      )}
    </div>
  );
}

function Photo({ src, alt = '', className = '', isEditing = false }) {
  const resolved = useImageUrl(src);
  if (resolved) return <img src={resolved} alt={alt} className={`bl-photo ${className}`} loading="lazy" decoding="async" />;
  return <PhotoPlaceholder className={className} isEditing={isEditing}/>;
}

/* ─── Spiral spine — memoized, never re-renders ─────────────── */
const Spine = memo(function Spine() {
  return (
    <div className="bl-spine" aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="bl-ring">
          <svg viewBox="0 0 36 32" xmlns="http://www.w3.org/2000/svg">
            {/* Reference the shared gradient defined once in SpineDefs */}
            <ellipse cx="18" cy="16" rx="15" ry="11" fill="none"
              stroke="url(#bl-ring-grad)" strokeWidth="4.5"/>
            <path d="M4 10 Q18 3 32 10" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
            <path d="M5 22 Q18 29 31 22" stroke="rgba(0,0,0,0.28)" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
            <ellipse cx="18" cy="16" rx="8.5" ry="5.5" fill="rgba(15,10,5,0.65)" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5"/>
          </svg>
        </div>
      ))}
    </div>
  );
});

/* ─── Shared SVG defs — rendered once at root, referenced by all Spine instances ─ */
const SpineDefs = memo(function SpineDefs() {
  return (
    <svg width="0" height="0" style={{ position:'absolute', overflow:'hidden' }} aria-hidden="true">
      <defs>
        <linearGradient id="bl-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#c8bfb0"/>
          <stop offset="30%"  stopColor="#7a7068"/>
          <stop offset="55%"  stopColor="#e0d8c8"/>
          <stop offset="80%"  stopColor="#5a5248"/>
          <stop offset="100%" stopColor="#a8a090"/>
        </linearGradient>
        {/* Shared torn-paper filter — reused by all TornCircle instances via url(#bl-torn-shared) */}
        <filter id="bl-torn-shared" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="turbulence" baseFrequency="0.05 0.07" numOctaves="3" seed="17" result="turb"/>
          <feDisplacementMap in="SourceGraphic" in2="turb" scale="9" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>
    </svg>
  );
});

/* ─── Torn-paper rectangular photo — memoized ───────────────── */
const TornPhoto = memo(function TornPhoto({ src, alt='', className='', rotate=0, isEditing=false, onReplace, onRemove, onTransformChange, photoData }) {
  return (
    <div
      className={`bl-torn-rect ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <div className="bl-torn-rect-inner">
        <DraggablePhoto
          src={src} alt={alt}
          className="bl-torn-img"
          isEditing={isEditing}
          onReplace={onReplace}
          onRemove={onRemove}
          onTransformChange={onTransformChange}
          photoData={photoData}
          objectFit="cover"
        />
      </div>
    </div>
  );
});

/* ─── Torn-paper circular photo — memoized ──────────────────── */
const TornCircle = memo(function TornCircle({ src, alt='', className='', size=200, rotate=0, isEditing=false, onReplace, onRemove, onTransformChange, photoData }) {
  const uid = useRef(`tc${Math.random().toString(36).slice(2)}`).current;
  const border = size + 20;
  const half = border / 2;

  return (
    <div
      className={`bl-torn-circle ${className}`}
      style={{ width: size, height: size, transform: `rotate(${rotate}deg)`, position: 'relative', flexShrink: 0 }}
    >
      {/* Photo clipped to circle — sits on top */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0,
        width: size, height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        zIndex: 1,
      }}>
        <DraggablePhoto
          src={src} alt={alt}
          isEditing={isEditing}
          onReplace={onReplace}
          onRemove={onRemove}
          onTransformChange={onTransformChange}
          photoData={photoData}
          objectFit="cover"
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Torn paper ring — only the border, not the fill, sits on top of photo */}
      <svg
        viewBox={`0 0 ${border} ${border}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ position:'absolute', inset: -10, width: border, height: border, pointerEvents: 'none', zIndex: 2 }}
        aria-hidden="true"
      >
        <defs>
          <mask id={`${uid}ring`}>
            {/* white = show, black = hide */}
            <rect width={border} height={border} fill="white"/>
            {/* punch out the inner circle to show photo through */}
            <circle cx={half} cy={half} r={size / 2 - 2} fill="black"/>
          </mask>
        </defs>
        {/* Full circle with torn filter, masked to ring only */}
        <circle
          cx={half} cy={half} r={half - 1}
          fill="white"
          mask={`url(#${uid}ring)`}
          style={{ filter: `url(#bl-torn-shared) drop-shadow(4px 7px 8px rgba(30,12,0,0.45))` }}
        />
      </svg>
    </div>
  );
});

/* ─── Washi-tape note — memoized ───────────────────────────── */
const WashiNote = memo(function WashiNote({ children, className='', rotate=0 }) {
  return (
    <div className={`bl-washi-note ${className}`} style={{ transform: `rotate(${rotate}deg)` }}>
      <div className="bl-washi-tape bl-washi-tape-tl"/>
      <div className="bl-washi-tape bl-washi-tape-tr"/>
      <div className="bl-washi-note-body">{children}</div>
    </div>
  );
});

/* ─── Pink fact banner — memoized ──────────────────────────── */
const FactBanner = memo(function FactBanner({ children, className='' }) {
  return <div className={`bl-fact-banner ${className}`}>{children}</div>;
});

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function ButterflyLetters(props) {
  return (
    <BookErrorBoundary>
      <ButterflyLettersInner {...props}/>
    </BookErrorBoundary>
  );
}

function ButterflyLettersInner({ isEditing = false, onContentChange }) {
  const navigate  = useNavigate();
  const { coupleAuth, getCoupleBySlug, myCouple } = useApp();
  const couple    = isEditing ? myCouple : getCoupleBySlug(coupleAuth?.slug);
  const name1     = couple?.name1 || 'Anna';
  const name2     = couple?.name2 || 'Sebastian';
  const photos    = couple?.lettersPhotos || [];
  const p         = (i) => photos[i]?.url || null;
  const lp        = couple?.pageContent?.lettersPage || {};
  const s         = (field, fallback) => lp[field] ?? fallback;
  const save      = (field, val) => onContentChange?.('lettersPage', { ...lp, [field]: val });

  // Keep a ref that always points to the latest photos array so transform
  // save callbacks never close over a stale copy.
  const photosRef = useRef(photos);
  photosRef.current = photos;

  /* photo replace / remove helpers */
  const replacePhoto = (idx, key) => {
    const updated = [...photosRef.current];
    if (updated[idx]) updated[idx] = { ...updated[idx], url: key, translateX: 0, translateY: 0, scale: 1 };
    else updated[idx] = { id: Date.now(), url: key, caption: '', translateX: 0, translateY: 0, scale: 1 };
    onContentChange?.('lettersPhotos', updated);
  };
  const removePhoto = (idx) => {
    const updated = [...photosRef.current];
    if (updated[idx]) updated[idx] = { ...updated[idx], url: '' };
    onContentChange?.('lettersPhotos', updated);
  };

  /* photo transform save helper — always reads fresh photos from ref */
  const savePhotoTransform = (idx, transform) => {
    const updated = [...photosRef.current];
    if (updated[idx]) {
      updated[idx] = { ...updated[idx], ...transform };
    } else {
      updated[idx] = { id: Date.now(), url: '', caption: '', ...transform };
    }
    onContentChange?.('lettersPhotos', updated);
  };

  /* ── Book state ─────────────────────────────────────────── */
  const TOTAL = 6; // pages 0–5
  const [current, setCurrent] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [flippingFrom, setFlippingFrom] = useState(null);

  const flipTimerRef = useRef(null);

  const goTo = useCallback((next) => {
    if (flipping || next === current || next < 0 || next >= TOTAL) return;
    // Clear any pending timer from a rapid click
    if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    setFlipping(true);
    setFlippingFrom(current);
    setCurrent(next);
    flipTimerRef.current = setTimeout(() => {
      setFlipping(false);
      setFlippingFrom(null);
      flipTimerRef.current = null;
    }, 740); // slightly past the 720ms CSS duration
  }, [current, flipping]);

  // Clean up timer on unmount
  useEffect(() => () => {
    if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
  }, []);

  const goNext = useCallback(() => goTo(current + 1), [goTo, current]);
  const goPrev = useCallback(() => goTo(current - 1), [goTo, current]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft')  goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  /* page state class — only add is-flipping to pages involved in the current flip */
  const pageClass = (idx) => {
    const isInFlight = flipping && (idx === current || idx === flippingFrom);
    let base;
    if (idx < current)       base = 'bl-page is-past';
    else if (idx === current) base = 'bl-page is-current';
    else                      base = 'bl-page is-future';
    return isInFlight ? `${base} is-flipping` : base;
  };

  /* z-index: current on top, futures stacked in order below, pasts behind everything */
  const pageZ = (idx) => {
    if (idx === current)  return TOTAL + 2;
    if (idx < current)   return idx;           // pasts stack low
    return TOTAL + 1 - (idx - current);        // futures: closest to current = highest
  };

  return (
    <div className="bl-book-container">
      {/* Shared SVG defs — one instance for all spine gradients */}
      <SpineDefs/>

      {/* Back button */}
      {!isEditing && (
        <button className="bl-back-btn" onClick={() => navigate('/butterflies360')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back
        </button>
      )}

      <div className="bl-book">

        {/* ── PAGE 0: Cover ─────────────────────────────── */}
        <div className={pageClass(0)} style={{ zIndex: pageZ(0) }}>
          <CoverHero
            name1={name1} name2={name2}
            photoSrc={p(0)}
            titleWord1={s('coverTitle1','Our')}
            titleWord2={s('coverTitle2','50th')}
            subtitle={s('coverSub',`A 50th wedding anniversary\npresentation celebrating\n${name1} & ${name2}.`)}
            onChangeTitleWord1={v => save('coverTitle1',v)}
            onChangeTitleWord2={v => save('coverTitle2',v)}
            onChangeSubtitle={v => save('coverSub',v)}
            isEditing={isEditing}
            onReplacePhoto={k => replacePhoto(0, k)}
            onRemovePhoto={() => removePhoto(0)}
          />
        </div>

        {/* ── PAGE 1: 3 Facts ───────────────────────────── */}
        <div className={pageClass(1)} style={{ zIndex: pageZ(1) }}>
          <Spine/>
          <div className="bl-page-content bl-facts-layout">
            {/* Left: title + banners */}
            <div className="bl-facts-left">
              <div className="bl-facts-title">
                <EditableText as="h2" className="bl-script-xl"
                  value={s('factsTitle',`3 Facts about ${name1}\n& ${name2}`)}
                  isEditing={isEditing} onChange={v=>save('factsTitle',v)} multiline/>
              </div>
              <div className="bl-facts-banners">
                <FactBanner className="bl-banner-1">
                  <EditableText as="span" className="bl-banner-text"
                    value={s('fact1',`They met in a local coffee shop.`)}
                    isEditing={isEditing} onChange={v=>save('fact1',v)}/>
                </FactBanner>
                <FactBanner className="bl-banner-2">
                  <EditableText as="span" className="bl-banner-text"
                    value={s('fact2','They both love reading fiction books.')}
                    isEditing={isEditing} onChange={v=>save('fact2',v)}/>
                </FactBanner>
                <FactBanner className="bl-banner-3">
                  <EditableText as="span" className="bl-banner-text"
                    value={s('fact3',`${name2} proposed during a concert.`)}
                    isEditing={isEditing} onChange={v=>save('fact3',v)}/>
                </FactBanner>
              </div>
            </div>
            {/* Right: photo */}
            <div className="bl-facts-right">
              <div className="bl-facts-photo-wrap">
                <TornPhoto rotate={2} isEditing={isEditing} onReplace={k=>replacePhoto(1,k)} onRemove={()=>removePhoto(1)}
                  onTransformChange={t=>savePhotoTransform(1,t)} photoData={photos[1]}
                  src={p(1)} alt="couple" className="bl-facts-photo"/>
              </div>
            </div>
          </div>
        </div>

        {/* ── PAGE 2: Messages ──────────────────────────── */}
        <div className={pageClass(2)} style={{ zIndex: pageZ(2) }}>
          <Spine/>
          <div className="bl-page-content bl-messages-layout">
            {/* Note 1 — top left */}
            <WashiNote rotate={-3} className="bl-note-1">
              <EditableText as="p" className="bl-note-text" multiline
                value={s('msg1','May you continue to love each other for the rest of your lives.')}
                isEditing={isEditing} onChange={v=>save('msg1',v)}/>
              <EditableText as="p" className="bl-note-sig"
                value={s('msg1sig','- Shawn Garcia')}
                isEditing={isEditing} onChange={v=>save('msg1sig',v)}/>
            </WashiNote>
            {/* Photo 1 — top right */}
            <TornPhoto rotate={4} isEditing={isEditing} onReplace={k=>replacePhoto(2,k)} onRemove={()=>removePhoto(2)}
              onTransformChange={t=>savePhotoTransform(2,t)} photoData={photos[2]}
              src={p(2)} alt="couple" className="bl-msg-photo-tr"/>
            {/* Photo 2 — bottom left */}
            <TornPhoto rotate={-5} isEditing={isEditing} onReplace={k=>replacePhoto(3,k)} onRemove={()=>removePhoto(3)}
              onTransformChange={t=>savePhotoTransform(3,t)} photoData={photos[3]}
              src={p(3)} alt="couple" className="bl-msg-photo-bl"/>
            {/* Note 2 — bottom right */}
            <WashiNote rotate={3} className="bl-note-2">
              <EditableText as="p" className="bl-note-text" multiline
                value={s('msg2','Happy Anniversary! Your love story is our favorite. We both love you.')}
                isEditing={isEditing} onChange={v=>save('msg2',v)}/>
              <EditableText as="p" className="bl-note-sig"
                value={s('msg2sig','- Donna Stroupe')}
                isEditing={isEditing} onChange={v=>save('msg2sig',v)}/>
            </WashiNote>
            {/* Leaf deco */}
            <div className="bl-msg-leaf" aria-hidden="true">
              <svg viewBox="0 0 90 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M45 155 C45 155 8 110 8 65 C8 30 22 10 45 8 C68 10 82 30 82 65 C82 110 45 155 45 155Z" fill="#6a7838" opacity="0.7"/>
                <path d="M45 8 L45 150" stroke="#4a5820" strokeWidth="1.2"/>
                {[30,50,70,90,110].map((y,i)=>(
                  <g key={i}>
                    <path d={`M45 ${y} Q${45-(i%2===0?22:18)} ${y-8} ${45-(i%2===0?36:30)} ${y-5}`} stroke="#4a5820" strokeWidth="0.7" fill="none"/>
                    <path d={`M45 ${y} Q${45+(i%2===0?22:18)} ${y-8} ${45+(i%2===0?36:30)} ${y-5}`} stroke="#4a5820" strokeWidth="0.7" fill="none"/>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>

        {/* ── PAGE 3: Wonderful Day ─────────────────────── */}
        <div className={pageClass(3)} style={{ zIndex: pageZ(3) }}>
          <Spine/>
          <div className="bl-page-content bl-wonderful-layout">
            {/* Two-column grid: text left, heart right — heart never moves */}
            <div className="bl-wonderful-top">
              <div className="bl-wonderful-text">
                <EditableText as="h2" className="bl-script-xl bl-wonderful-h"
                  value={s('wonderfulTitle','May you enjoy your wonderful day.')}
                  isEditing={isEditing} onChange={v=>save('wonderfulTitle',v)} multiline/>
                <EditableText as="p" className="bl-wonderful-sub"
                  value={s('wonderfulSub',"Here's to more prosperous and joyous years to come.")}
                  isEditing={isEditing} onChange={v=>save('wonderfulSub',v)} multiline/>
              </div>
              {/* Heart photo — in its own fixed column, never pushed by text */}
              <div className="bl-circ-tl-wrap">
                <TornCircle size={250} rotate={-3} isEditing={isEditing} onReplace={k=>replacePhoto(4,k)} onRemove={()=>removePhoto(4)}
                  onTransformChange={t=>savePhotoTransform(4,t)} photoData={photos[4]}
                  src={p(4)} alt="couple" className="bl-circ-tl"/>
              </div>
            </div>
            {/* Bottom row */}
            <div className="bl-wonderful-bottom">
              <div className="bl-wonderful-flower" aria-hidden="true">
                <svg viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M60 135 Q55 110 45 90 Q35 70 38 50 Q42 30 60 20 Q78 30 82 50 Q85 70 75 90 Q65 110 60 135Z" fill="#8a3028" opacity="0.75"/>
                  {[0,45,90,135,180,225,270,315].map((deg,i)=>(
                    <ellipse key={i} cx="60" cy="42" rx="14" ry="22" fill="#a83838" opacity="0.7"
                      transform={`rotate(${deg} 60 60)`}/>
                  ))}
                  <circle cx="60" cy="60" r="14" fill="#c84828" opacity="0.85"/>
                  <circle cx="60" cy="60" r="8"  fill="#e06030" opacity="0.9"/>
                  {Array.from({length:12}).map((_,i)=>(
                    <circle key={i} cx={60+10*Math.cos(i*30*Math.PI/180)} cy={60+10*Math.sin(i*30*Math.PI/180)} r="1.5" fill="#f8a050" opacity="0.9"/>
                  ))}
                </svg>
              </div>
              <TornCircle size={260} rotate={2} isEditing={isEditing} onReplace={k=>replacePhoto(5,k)} onRemove={()=>removePhoto(5)}
                onTransformChange={t=>savePhotoTransform(5,t)} photoData={photos[5]}
                src={p(5)} alt="couple" className="bl-circ-bc"/>
              <TornCircle size={255} rotate={-2} isEditing={isEditing} onReplace={k=>replacePhoto(6,k)} onRemove={()=>removePhoto(6)}
                onTransformChange={t=>savePhotoTransform(6,t)} photoData={photos[6]}
                src={p(6)} alt="couple" className="bl-circ-br"/>
            </div>
          </div>
        </div>

        {/* ── PAGE 4: Eternal Love ──────────────────────── */}
        <div className={pageClass(4)} style={{ zIndex: pageZ(4) }}>
          <Spine/>
          <div className="bl-page-content bl-eternal-layout">
            {/* Large script text left */}
            <div className="bl-eternal-text">
              <EditableText as="h2" className="bl-script-xl bl-eternal-h"
                value={s('eternalTitle','We wish you eternal love and happiness.')}
                isEditing={isEditing} onChange={v=>save('eternalTitle',v)} multiline/>
            </div>
            {/* Large torn photo right */}
            <div className="bl-eternal-photo-wrap">
              {/* Sunflower watercolor behind photo */}
              <div className="bl-eternal-flower" aria-hidden="true">
                <svg viewBox="0 0 180 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg,i)=>(
                    <ellipse key={i} cx="90" cy="55" rx="16" ry="38" fill={i%2===0?"#d46020":"#e07828"} opacity="0.65"
                      transform={`rotate(${deg} 90 90)`}/>
                  ))}
                  <circle cx="90" cy="90" r="32" fill="#7a3010" opacity="0.8"/>
                  <circle cx="90" cy="90" r="22" fill="#5a2008" opacity="0.7"/>
                  {Array.from({length:20}).map((_,i)=>(
                    <circle key={i} cx={90+18*Math.cos(i*18*Math.PI/180)} cy={90+18*Math.sin(i*18*Math.PI/180)} r="2" fill="#c84818" opacity="0.6"/>
                  ))}
                </svg>
              </div>
              <TornPhoto rotate={-4} isEditing={isEditing} onReplace={k=>replacePhoto(7,k)} onRemove={()=>removePhoto(7)}
                onTransformChange={t=>savePhotoTransform(7,t)} photoData={photos[7]}
                src={p(7)} alt="couple" className="bl-eternal-photo"/>
            </div>
          </div>
        </div>

        {/* ── PAGE 5: Thank You ─────────────────────────── */}
        <div className={pageClass(5)} style={{ zIndex: pageZ(5) }}>
          <Spine/>
          <div className="bl-page-content bl-thankyou-layout">
            {/* Large torn landscape photo */}
            <TornPhoto rotate={-3} isEditing={isEditing} onReplace={k=>replacePhoto(8,k)} onRemove={()=>removePhoto(8)}
              onTransformChange={t=>savePhotoTransform(8,t)} photoData={photos[8]}
              src={p(8)} alt="couple on bench" className="bl-ty-photo"/>
            {/* Right column: flowers + banner */}
            <div className="bl-ty-right-col">
              {/* Blue flower top-left of page — absolute over photo */}
              <div className="bl-ty-flower-l" aria-hidden="true">
                <svg viewBox="0 0 120 130" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {[0,45,90,135,180,225,270,315].map((deg,i)=>(
                    <ellipse key={i} cx="60" cy="32" rx="13" ry="28" fill={i%2===0?"#3060a8":"#4878c0"} opacity="0.7"
                      transform={`rotate(${deg} 60 60)`}/>
                  ))}
                  <circle cx="60" cy="60" r="18" fill="#204880" opacity="0.85"/>
                  <circle cx="60" cy="60" r="10" fill="#406098" opacity="0.9"/>
                </svg>
              </div>
              {/* Yellow flower — right side */}
              <div className="bl-ty-flower-r" aria-hidden="true">
                <svg viewBox="0 0 120 130" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {[0,45,90,135,180,225,270,315].map((deg,i)=>(
                    <ellipse key={i} cx="60" cy="32" rx="13" ry="28" fill={i%2===0?"#d8a020":"#e8b828"} opacity="0.75"
                      transform={`rotate(${deg} 60 60)`}/>
                  ))}
                  <circle cx="60" cy="60" r="18" fill="#a06010" opacity="0.85"/>
                  <circle cx="60" cy="60" r="10" fill="#c07818" opacity="0.9"/>
                </svg>
              </div>
              {/* Pink banner */}
              <div className="bl-ty-banner">
                <EditableText as="h2" className="bl-ty-banner-title"
                  value={s('tyTitle','Thank you for coming!')}
                  isEditing={isEditing} onChange={v=>save('tyTitle',v)}/>
                <EditableText as="p" className="bl-ty-banner-sub"
                  value={s('tySub','Hope you had fun!')}
                  isEditing={isEditing} onChange={v=>save('tySub',v)}/>
              </div>
            </div>
          </div>
        </div>

      </div>{/* end .bl-book */}

      {/* ── Navigation ──────────────────────────────────── */}
      <button className="bl-nav-btn bl-nav-prev" onClick={goPrev}
        disabled={current === 0} aria-label="Previous page">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <button className="bl-nav-btn bl-nav-next" onClick={goNext}
        disabled={current === TOTAL - 1} aria-label="Next page">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>

      {/* ── Dot indicators ──────────────────────────────── */}
      <div className="bl-dots">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <button key={i} className={`bl-dot ${i === current ? 'bl-dot-active' : ''}`}
            onClick={() => goTo(i)} aria-label={`Go to page ${i + 1}`}/>
        ))}
      </div>

    </div>
  );
}
