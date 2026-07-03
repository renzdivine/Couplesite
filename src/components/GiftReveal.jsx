import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ButterflyAnimation from './ButterflyAnimation';
import '../styles/components/GiftReveal.css';


function GiftBox({ opening, btnRef, onClick }) {
  return (
    <button
      ref={btnRef}
      className={`gr-gift-btn${opening ? ' gr-gift-btn--opening' : ''}`}
      onClick={!opening ? onClick : undefined}
      aria-label="Open your gift"
      disabled={opening}
    >
      {!opening && <span className="gr-gift-pulse" aria-hidden="true" />}
      {opening  && <span className="gr-gift-burst" aria-hidden="true" />}

      <svg
        className="gr-gift-svg"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="grBoxBody" x1="14" y1="52" x2="106" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#c0305a" />
            <stop offset="100%" stopColor="#8a1a3c" />
          </linearGradient>
          <linearGradient id="grBoxLid" x1="10" y1="40" x2="110" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#e0406e" />
            <stop offset="100%" stopColor="#b02850" />
          </linearGradient>
          <linearGradient id="grRibbon" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor="#ffd6e8" />
            <stop offset="100%" stopColor="#f48fb1" />
          </linearGradient>
          <linearGradient id="grBow" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor="#ff80ab" />
            <stop offset="100%" stopColor="#e91e8c" />
          </linearGradient>
          <linearGradient id="grBowInner" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor="#fce4ec" />
            <stop offset="100%" stopColor="#f48fb1" />
          </linearGradient>
        </defs>

        {}
        <rect x="14" y="52" width="92" height="58" rx="6" fill="url(#grBoxBody)" />
        <rect x="54" y="52" width="12" height="58" rx="3" fill="url(#grRibbon)" />
        <circle cx="28" cy="72" r="3"   fill="rgba(255,255,255,0.35)" />
        <circle cx="90" cy="88" r="2.5" fill="rgba(255,255,255,0.25)" />

        {}
        <g
          className={`gr-gift-lid${opening ? ' gr-gift-lid--open' : ''}`}
          style={{ transformOrigin: '60px 58px' }}
        >
          <rect x="10" y="40" width="100" height="18" rx="5" fill="url(#grBoxLid)" />
          <rect x="10" y="46" width="100" height="12" rx="3" fill="url(#grRibbon)" />
          <ellipse cx="42" cy="30" rx="18" ry="12" fill="url(#grBow)" transform="rotate(-22 42 30)" />
          <ellipse cx="78" cy="30" rx="18" ry="12" fill="url(#grBow)" transform="rotate(22 78 30)" />
          <circle cx="60" cy="36" r="9" fill="url(#grBow)" />
          <circle cx="60" cy="36" r="5" fill="url(#grBowInner)" />
          <path
            d="M18 28 L20 22 L22 28 L28 26 L23 31 L25 37 L20 33 L15 37 L17 31 L12 26 Z"
            fill="rgba(255,220,240,0.55)"
          />
        </g>
      </svg>

      {!opening && <span className="gr-gift-label">Open your surprise</span>}
    </button>
  );
}


export default function GiftReveal() {
  const navigate = useNavigate();

  
  const [phase,           setPhase]           = useState('idle');
  const [boxVisible,      setBoxVisible]       = useState(true);
  const [butterflyOrigin, setButterflyOrigin]  = useState(null);
  const btnRef = useRef(null);

  function handleBoxClick() {
    if (phase !== 'idle') return;

    
    let origin = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      origin = {
        x: Math.round(r.left + r.width  / 2),
        y: Math.round(r.top  + r.height / 2),
      };
    }

    setButterflyOrigin(origin);
    setPhase('opening');

    
    setTimeout(() => setPhase('butterflies'), 650);

    
    setTimeout(() => setBoxVisible(false), 3500);

    
    setTimeout(() => setPhase('leaving'), 10000);
    setTimeout(() => navigate('/opening'), 20800);
  }

  const isOpening     = phase !== 'idle';
  const butterfliesOn = phase === 'butterflies' || phase === 'leaving';
  const isLeaving     = phase === 'leaving';

  return (
    <div className={`gr-root${isLeaving ? ' gr-root--leaving' : ''}`}>

      {}
      <div className="gr-flower-bg" aria-hidden="true" />

      {}
      <div className="gr-overlay" aria-hidden="true" />

      {}
      <div className={`gr-box-wrap${boxVisible ? '' : ' gr-box-wrap--hidden'}`}>
        <GiftBox
          opening={isOpening}
          btnRef={btnRef}
          onClick={handleBoxClick}
        />
      </div>

      {}
      {butterflyOrigin && (
        <ButterflyAnimation active={butterfliesOn} origin={butterflyOrigin} />
      )}
    </div>
  );
}
