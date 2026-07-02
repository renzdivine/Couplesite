// ─────────────────────────────────────────────────────────────
// AdminDashboard.jsx  — Client (Admin) personal dashboard
// Shows the REAL page flow, fully editable inline.
// No dropdowns. Pages render exactly as visitors see them.
// Route: /admin
// ─────────────────────────────────────────────────────────────

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Heart, LogOut, ExternalLink, Copy, Check, Edit3, ImagePlus } from 'lucide-react';

import CodeScreen       from './CodeScreen';
import MemoryGame       from '../components/MemoryGame';
import ButterflyPhotos  from './ButterflyPhotos';
import ButterflyLetters from './ButterflyLetters';
import ButterflyStory   from './ButterflyStory';
import ButterflyWish    from './ButterflyWish';

import ImageCropper    from '../components/ImageCropper';
import { useImageUrl } from '../utils/useImageUrl';
import { saveImage }   from '../utils/imageStore';
import '../styles/pages/AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { clientSession, clientLogout, myCouple, updateCouple } = useApp();
  const [toast, setToast] = useState('');

  if (!clientSession) { navigate('/admin/login', { replace: true }); return null; }

  if (!myCouple) {
    return (
      <div className="ad-no-page">
        <Heart size={48} color="rgba(255,154,181,0.3)" strokeWidth={1}/>
        <h2>No Love Page Assigned</h2>
        <p>Contact the Master Admin to get a page assigned.</p>
        <button onClick={() => { clientLogout(); navigate('/admin/login'); }}>Logout</button>
      </div>
    );
  }

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };
  const siteUrl = `${window.location.origin}/love/${myCouple.slug}`;

  const save = (section, value) => {
    if (section === 'photosList') {
      updateCouple(myCouple.slug, { photos: value });
    } else if (section === 'lettersPhotos') {
      updateCouple(myCouple.slug, { lettersPhotos: value });
    } else if (section === 'wishes') {
      updateCouple(myCouple.slug, { pageContent: { ...myCouple.pageContent, wishes: value } });
    } else if (section === 'songs') {
      updateCouple(myCouple.slug, { songs: value });
    } else {
      updateCouple(myCouple.slug, { pageContent: { ...myCouple.pageContent, [section]: value } });
    }
    showToast('Saved');
  };

  return (
    <div className="ad-root">
      {toast && <div className="ad-toast"><Check size={12}/> {toast}</div>}

      {/* ── floating top bar ── */}
      <div className="ad-topbar">
        <div className="ad-topbar-left">
          <Heart size={15} color="#e91e8c" fill="#e91e8c"/>
          <span className="ad-topbar-name">HeartLink</span>
          <span className="ad-topbar-divider"/>
          <span className="ad-topbar-couple">{myCouple.name1} &amp; {myCouple.name2}</span>
        </div>
        <div className="ad-topbar-right">
          <span className="ad-edit-pill"><Edit3 size={10}/> Editing</span>
          <button className="ad-topbar-btn ad-topbar-btn--copy"
            onClick={() => { navigator.clipboard.writeText(siteUrl).catch(()=>{}); showToast('Link copied!'); }}>
            <Copy size={12}/> Copy Link
          </button>
          <button className="ad-topbar-btn ad-topbar-btn--preview"
            onClick={() => navigate(`/love/${myCouple.slug}`)}>
            <ExternalLink size={12}/> Preview
          </button>
          <button className="ad-topbar-btn ad-topbar-btn--logout"
            onClick={() => { clientLogout(); navigate('/admin/login'); }}>
            <LogOut size={12}/> Logout
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          THE ACTUAL PAGE FLOW — all editable
      ══════════════════════════════════════════ */}

      {/* 1 — Code Screen */}
      <div className="ad-section" id="section-code">
        <SectionLabel>🔐 Code Screen</SectionLabel>
        <BgSection
          bgImage={myCouple.pageContent?.codeScreen?.bgImage}
          onBgChange={url => save('codeScreen', { ...myCouple.pageContent?.codeScreen, bgImage: url })}
        >
          <CodeScreen
            couple={myCouple} slug={myCouple.slug} onSuccess={() => {}}
            isEditing
            onContentChange={v => save('codeScreen', v)}
            onCodeChange={code => {
              updateCouple(myCouple.slug, { accessCode: code });
              showToast(`Code set to ${code}`);
            }}
          />
        </BgSection>
      </div>

      {/* 2 — Memory Game */}
      <div className="ad-section" id="section-game">
        <SectionLabel>🃏 Memory Game</SectionLabel>
        <BgSection
          bgImage={myCouple.pageContent?.memoryGame?.bgImage}
          onBgChange={url => save('memoryGame', { ...myCouple.pageContent?.memoryGame, bgImage: url })}
        >
          <MemoryGame
            couple={myCouple} onComplete={() => {}}
            isEditing
            onContentChange={v => {
              // v may contain __memoryGamePhotos (photo slots) separate from text fields
              if (v.__memoryGamePhotos) {
                updateCouple(myCouple.slug, { memoryGamePhotos: v.__memoryGamePhotos });
                const { __memoryGamePhotos: _, ...textFields } = v;
                if (Object.keys(textFields).length) save('memoryGame', textFields);
              } else {
                save('memoryGame', v);
              }
            }}
          />
        </BgSection>
      </div>

      {/* 3 — Butterfly Photos */}
      <div className="ad-section" id="section-photos">
        <SectionLabel>📷 Butterfly Photos</SectionLabel>
        <ButterflyPhotos isEditing onContentChange={save}/>
      </div>

      {/* 4 — Butterfly Letters */}
      <div className="ad-section" id="section-letters">
        <SectionLabel>✉️ Butterfly Letters</SectionLabel>
        <ButterflyLetters isEditing onContentChange={save}/>
      </div>

      {/* 5 — Butterfly Story */}
      <div className="ad-section" id="section-story">
        <SectionLabel>🎵 Butterfly Story</SectionLabel>
        <ButterflyStory isEditing onContentChange={save}/>
      </div>

      {/* 6 — Butterfly Wish */}
      <div className="ad-section" id="section-wish">
        <SectionLabel>🌠 Butterfly Wish</SectionLabel>
        <BgSection
          bgImage={myCouple.pageContent?.wishPage?.bgImage}
          onBgChange={url => save('wishPage', { ...myCouple.pageContent?.wishPage, bgImage: url })}
        >
          <ButterflyWish isEditing onContentChange={save}/>
        </BgSection>
      </div>

    </div>
  );
}

/* thin label strip above each section so admin knows what they're editing */
function SectionLabel({ children }) {
  return <div className="ad-section-label">{children}</div>;
}

/* ══════════════════════════════════════════
   BgSection — full-viewport bg with "Change Background" button
   Used for Code Screen and Memory Game
══════════════════════════════════════════ */
function BgSection({ bgImage, onBgChange, children }) {
  const fileRef   = useRef(null);
  const [hovering, setHovering] = useState(false);
  const resolvedBg = useImageUrl(bgImage);  // resolves idb:// → object URL

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const key = await saveImage(file);   // → "idb://img_123_abc"
      onBgChange(key);
    } catch (err) {
      console.error('BG image save failed:', err);
    }
    e.target.value = '';
  };

  const bgStyle = resolvedBg
    ? { backgroundImage:`url(${resolvedBg})`, backgroundSize:'cover', backgroundPosition:'center', backgroundRepeat:'no-repeat' }
    : { background:'radial-gradient(ellipse at 60% 40%, #2a0030 0%, #080010 70%)' };

  return (
    <div
      className="ad-bg-section"
      style={bgStyle}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {children}

      <button
        className={`ad-bg-change-btn ${hovering ? 'ad-bg-change-btn--visible' : ''}`}
        onClick={() => fileRef.current?.click()}
        title="Change background image"
      >
        <ImagePlus size={13}/>
        Change Background
      </button>

      {resolvedBg && hovering && (
        <button
          className="ad-bg-remove-btn"
          onClick={() => onBgChange(null)}
          title="Remove custom background"
        >
          ✕ Remove
        </button>
      )}

      <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile}/>
    </div>
  );
}
