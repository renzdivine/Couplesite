import { useState, useEffect, useRef, useCallback, memo, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { EditableText, EditablePhoto } from '../components/EditableField';
import { saveImage } from '../utils/imageStore';
import { useImageUrl } from '../utils/useImageUrl';
import CoverHero from '../components/CoverHero';
import '../styles/pages/ButterflyLetters.css';

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
function Photo({ src, alt = '', className = '' }) {
  const resolved = useImageUrl(src);
  if (resolved) return <img src={resolved} alt={alt} className={`bl-photo ${className}`} loading="lazy" decoding="async" />;
  return (
    <div className={`bl-photo bl-photo-empty ${className}`}>
      <svg viewBox="0 0 40 32" fill="none">
        <rect width="40" height="32" rx="2" fill="rgba(0,0,0,0.08)" />
        <circle cx="14" cy="12" r="4" fill="rgba(0,0,0,0.15)" />
        <path d="M4 28 L14 16 L22 24 L28 18 L36 28Z" fill="rgba(0,0,0,0.1)" />
      </svg>
    </div>
  );
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
const TornPhoto = memo(function TornPhoto({ src, alt='', className='', rotate=0, isEditing=false, onReplace }) {
  const resolved = useImageUrl(src);
  return (
    <div className={`bl-torn-rect ${className}`} style={{ transform: `rotate(${rotate}deg)` }}>
      <div className="bl-torn-rect-inner">
        {isEditing ? (
          <EditablePhoto src={src} alt={alt} className="bl-torn-img" isEditing={isEditing} onReplace={onReplace}/>
        ) : resolved ? (
          <img src={resolved} alt={alt} className="bl-torn-img" loading="lazy" decoding="async"/>
        ) : (
          <div className="bl-torn-img bl-photo-empty">
            <svg viewBox="0 0 40 32" fill="none"><rect width="40" height="32" rx="2" fill="rgba(0,0,0,0.1)"/><circle cx="14" cy="12" r="4" fill="rgba(0,0,0,0.15)"/><path d="M4 28 L14 16 L22 24 L28 18 L36 28Z" fill="rgba(0,0,0,0.1)"/></svg>
          </div>
        )}
      </div>
    </div>
  );
});

/* ─── Torn-paper circular photo — memoized ──────────────────── */
const TornCircle = memo(function TornCircle({ src, alt='', className='', size=200, rotate=0, isEditing=false, onReplace }) {
  const resolved = useImageUrl(src);
  const uid = useRef(`tc${Math.random().toString(36).slice(2)}`).current;
  const border = size + 20;
  return (
    <div
      className={`bl-torn-circle ${className}`}
      style={{ width: size, height: size, transform: `rotate(${rotate}deg)` }}
    >
      <svg
        className="bl-torn-circle-svg"
        viewBox={`0 0 ${border} ${border}`}
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        style={{ position:'absolute', inset: -10, width: border, height: border }}
      >
        <defs>
          {/* clipPath still needs to be per-instance since it uses a unique id */}
          <clipPath id={`${uid}clip`}>
            <circle cx={border/2} cy={border/2} r={size/2}/>
          </clipPath>
        </defs>
        {/* Reuse the shared filter defined once in SpineDefs */}
        <circle cx={border/2} cy={border/2} r={border/2 - 1}
          fill="white"
          style={{ filter: `url(#bl-torn-shared) drop-shadow(4px 7px 8px rgba(30,12,0,0.45))` }}/>
        {resolved && (
          <image href={resolved} x="10" y="10" width={size} height={size}
            clipPath={`url(#${uid}clip)`} preserveAspectRatio="xMidYMid slice"/>
        )}
        {!resolved && (
          <circle cx={border/2} cy={border/2} r={size/2}
            clipPath={`url(#${uid}clip)`} fill="rgba(150,110,60,0.3)"/>
        )}
      </svg>
      {isEditing && (
        <EditablePhoto src={src} alt={alt}
          className="bl-circle-edit-overlay"
          isEditing={isEditing} onReplace={onReplace}
          style={{ position:'absolute', inset:0, borderRadius:'50%', opacity: 0 }}/>
      )}
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

  /* photo replace helper */
  const replacePhoto = (idx, key) => {
    const updated = [...photos];
    if (updated[idx]) updated[idx] = { ...updated[idx], url: key };
    else updated[idx] = { id: Date.now(), url: key, caption: '' };
    onContentChange?.('lettersPhotos', updated);
  };
  const EP = ({ idx, className }) => (
    <EditablePhoto src={p(idx)} alt="couple" className={className}
      isEditing={isEditing} onReplace={key => replacePhoto(idx, key)}/>
  );

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
                <TornPhoto rotate={2} isEditing={isEditing} onReplace={k=>replacePhoto(1,k)}
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
            <TornPhoto rotate={4} isEditing={isEditing} onReplace={k=>replacePhoto(2,k)}
              src={p(2)} alt="couple" className="bl-msg-photo-tr"/>
            {/* Photo 2 — bottom left */}
            <TornPhoto rotate={-5} isEditing={isEditing} onReplace={k=>replacePhoto(3,k)}
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
            {/* Top row */}
            <div className="bl-wonderful-top">
              <TornCircle size={270} rotate={-3} isEditing={isEditing} onReplace={k=>replacePhoto(4,k)}
                src={p(4)} alt="couple" className="bl-circ-tl"/>
              <div className="bl-wonderful-text">
                <EditableText as="h2" className="bl-script-xl bl-wonderful-h"
                  value={s('wonderfulTitle','May you enjoy your wonderful day.')}
                  isEditing={isEditing} onChange={v=>save('wonderfulTitle',v)} multiline/>
                <EditableText as="p" className="bl-wonderful-sub"
                  value={s('wonderfulSub',"Here's to more prosperous and joyous years to come.")}
                  isEditing={isEditing} onChange={v=>save('wonderfulSub',v)} multiline/>
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
              <TornCircle size={260} rotate={2} isEditing={isEditing} onReplace={k=>replacePhoto(5,k)}
                src={p(5)} alt="couple" className="bl-circ-bc"/>
              <TornCircle size={255} rotate={-2} isEditing={isEditing} onReplace={k=>replacePhoto(6,k)}
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
              <TornPhoto rotate={-4} isEditing={isEditing} onReplace={k=>replacePhoto(7,k)}
                src={p(7)} alt="couple" className="bl-eternal-photo"/>
            </div>
          </div>
        </div>

        {/* ── PAGE 5: Thank You ─────────────────────────── */}
        <div className={pageClass(5)} style={{ zIndex: pageZ(5) }}>
          <Spine/>
          <div className="bl-page-content bl-thankyou-layout">
            {/* Large torn landscape photo */}
            <TornPhoto rotate={-3} isEditing={isEditing} onReplace={k=>replacePhoto(8,k)}
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
