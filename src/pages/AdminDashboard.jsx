import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useCanvas } from '../context/CanvasContext';
import CanvasToolbar from '../components/CanvasToolbar';
import { Heart, LogOut, ExternalLink, Copy, Check, Edit3, ImagePlus, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

import CodeScreen       from './CodeScreen';
import GiftPrompt      from './GiftPrompt';
import MemoryGame       from '../components/MemoryGame';
import ButterflyPhotos  from './ButterflyPhotos';
import ButterflyLetters from './ButterflyLetters';
import ButterflyStory   from './ButterflyStory';
import ButterflyWish    from './ButterflyWish';

import ImageCropper    from '../components/ImageCropper';
import { useImageUrl } from '../utils/useImageUrl';
import { saveImage, deleteImage } from '../utils/imageStore';
import '../styles/pages/AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { clientSession, clientLogout, myCouple, updateCouple, loading } = useApp();
  const { selected, deselect } = useCanvas();
  const [toast, setToast] = useState('');
  const [zoom, setZoom] = useState(100);

  if (!clientSession) { navigate('/admin/login', { replace: true }); return null; }

  // Wait for Supabase data to load before rendering so components mount with
  // real photoData (translateX/Y/scale) — prevents transform flash on refresh
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0e0705',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <Heart size={32} color="#e91e8c" fill="#e91e8c" style={{ animation: 'adHeartBeat 1.2s ease-in-out infinite' }}/>
          <span style={{ color: 'rgba(255,154,181,0.7)', fontSize: '0.85rem', fontFamily: 'system-ui,sans-serif', letterSpacing: '0.05em' }}>
            Loading your love page…
          </span>
        </div>
      </div>
    );
  }

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

  // ── Toolbar action handler ─────────────────────────────────
  const handleToolbarAction = useCallback((action, sel) => {
    switch (action) {
      case 'delete':
        if (sel?.onAction) sel.onAction('delete');
        deselect();
        break;
      case 'duplicate':
        if (sel?.onAction) sel.onAction('duplicate');
        showToast('Duplicated');
        break;
      case 'hide':
        if (sel?.onStyleChange && sel?.style) {
          sel.onStyleChange({ ...sel.style, visibility: sel.style.visibility === 'hidden' ? 'visible' : 'hidden' });
        }
        break;
      case 'lock':
        if (sel?.onAction) sel.onAction('lock');
        showToast('Locked');
        break;
      case 'bringForward':
        if (sel?.onAction) sel.onAction('bringForward');
        break;
      case 'sendBackward':
        if (sel?.onAction) sel.onAction('sendBackward');
        break;
      case 'replaceImage':
        if (sel?.onAction) sel.onAction('replaceImage');
        break;
      case 'save':
        showToast('All changes saved!');
        break;
      case 'preview':
        navigate(`/love/${myCouple.slug}`);
        break;
      case 'addText':
        showToast('Click any text element to select and edit it');
        break;
      case 'addImage':
        showToast('Click any photo to select and replace it');
        break;
      default:
        break;
    }
  }, [deselect, navigate, myCouple?.slug]);

  const handleZoom = useCallback((delta) => {
    setZoom(z => Math.min(200, Math.max(25, z + delta)));
  }, []);

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
    <div className="ad-root has-ctb-toolbar">
      {toast && <div className="ad-toast"><Check size={12}/> {toast}</div>}

      {}
      <div className="ad-topbar">
        <div className="ad-topbar-left">
          <Heart size={15} color="#e91e8c" fill="#e91e8c"/>
          <span className="ad-topbar-name">LoveGift</span>
          <span className="ad-topbar-divider"/>
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

      {}

      {}
      <div className="ad-section" id="section-gift">
        <SectionLabel>🎁 Gift Prompt Screen</SectionLabel>
        <BgSection
          bgImage={myCouple.pageContent?.giftPrompt?.bgImage}
          fallbackBg="/redbg.png"
          onBgChange={url => save('giftPrompt', { ...myCouple.pageContent?.giftPrompt, bgImage: url })}
        >
          <GiftPrompt
            couple={myCouple}
            isEditing
            onContentChange={v => save('giftPrompt', v)}
          />
        </BgSection>
      </div>

      {}
      <div className="ad-section" id="section-code">
        <SectionLabel>🔐 Code Screen</SectionLabel>
        <BgSection
          bgImage={myCouple.pageContent?.codeScreen?.bgImage}
          fallbackBg="/codeScreenbg.png"
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

      {}
      <div className="ad-section" id="section-game">
        <SectionLabel>🃏 Memory Game</SectionLabel>
        <BgSection
          bgImage={myCouple.pageContent?.memoryGame?.bgImage}
          fallbackBg="/codeScreenbg.png"
          onBgChange={url => save('memoryGame', { ...myCouple.pageContent?.memoryGame, bgImage: url })}
        >
          <MemoryGame
            couple={myCouple} onComplete={() => {}}
            isEditing
            onContentChange={v => {
              try {
                console.log('[AdminDashboard] MemoryGame onContentChange:', v);
                
                if (v.__memoryGamePhotos) {
                  console.log('[AdminDashboard] Updating memoryGamePhotos:', v.__memoryGamePhotos);
                  updateCouple(myCouple.slug, { memoryGamePhotos: v.__memoryGamePhotos });
                  const { __memoryGamePhotos: _, ...textFields } = v;
                  if (Object.keys(textFields).length) save('memoryGame', textFields);
                } else {
                  save('memoryGame', v);
                }
              } catch (err) {
                console.error('[AdminDashboard] Error in MemoryGame onContentChange:', err);
              }
            }}
          />
        </BgSection>
      </div>

      {}
      <div className="ad-section" id="section-360">
        <SectionLabel>🦋 Butterflies 360</SectionLabel>
        <Bf360Preview
          couple={myCouple}
          onSave={v => save('butterfly360', { ...myCouple.pageContent?.butterfly360, ...v })}
        />
      </div>

      {}
      <div className="ad-section" id="section-photos">
        <SectionLabel>📷 Butterfly Photos</SectionLabel>
        <ButterflyPhotos key={myCouple.slug} isEditing onContentChange={save}/>
      </div>

      {}
      <div className="ad-section" id="section-letters">
        <SectionLabel>✉️ Butterfly Letters</SectionLabel>
        <ButterflyLetters key={myCouple.slug} isEditing onContentChange={save}/>
      </div>

      {}
      <div className="ad-section" id="section-story">
        <SectionLabel>🎵 Butterfly Story</SectionLabel>
        <ButterflyStory isEditing onContentChange={save}/>
      </div>

      {}
      <div className="ad-section" id="section-wish">
        <SectionLabel>🌠 Butterfly Wish</SectionLabel>
        <BgSection
          bgImage={myCouple.pageContent?.wishPage?.bgImage}
          fallbackBg="/Wishbg.png"
          onBgChange={url => save('wishPage', { ...myCouple.pageContent?.wishPage, bgImage: url })}
        >
          <ButterflyWish isEditing onContentChange={save}/>
        </BgSection>
      </div>

      {}
      <div className="ad-section" id="section-music">
        <SectionLabel>🎶 Background Music</SectionLabel>
        <BgMusicSection
          bgMusic={myCouple.bgMusic}
          onSave={key => updateCouple(myCouple.slug, { bgMusic: key })}
          showToast={showToast}
        />
      </div>

      {}
      <div className="ad-section" id="section-qr">
        <SectionLabel>📱 Your Love Page QR Code</SectionLabel>
        <QrSection siteUrl={siteUrl} showToast={showToast} />
      </div>

      {}
      <CanvasToolbar
        isEditing={true}
        onAction={handleToolbarAction}
      />

    </div>
  );
}


function SectionLabel({ children }) {
  return <div className="ad-section-label">{children}</div>;
}


function Bf360Preview({ couple, onSave }) {
  const bf360 = couple?.pageContent?.butterfly360;
  const defaultTitle = 'Hello Baby';
  const defaultHint  = 'Drag to look around · tap a butterfly';

  const [title, setTitle] = useState(bf360?.overlayTitle ?? defaultTitle);
  const [hint,  setHint]  = useState(bf360?.overlayHint  ?? defaultHint);

  return (
    <div className="ad-bf360-wrap">
      <div className="ad-bf360-inner">
        <div className="ad-bf360-heart">🦋</div>

        {}
        <input
          className="ad-bf360-title-input"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={() => onSave({ overlayTitle: title })}
          spellCheck={false}
          aria-label="360 overlay title"
        />

        {}
        <input
          className="ad-bf360-hint-input"
          value={hint}
          onChange={e => setHint(e.target.value)}
          onBlur={() => onSave({ overlayHint: hint })}
          spellCheck={false}
          aria-label="360 overlay hint"
        />
      </div>
    </div>
  );
}


function BgSection({ bgImage, fallbackBg, onBgChange, children }) {
  const fileRef   = useRef(null);
  const [hovering, setHovering] = useState(false);
  const resolvedBg = useImageUrl(bgImage);  

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const key = await saveImage(file);   
      onBgChange(key);
    } catch (err) {
      console.error('BG image save failed:', err);
    }
    e.target.value = '';
  };

  
  const activeBg = resolvedBg || fallbackBg || null;

  const bgStyle = activeBg
    ? { backgroundImage:`url(${activeBg})`, backgroundSize:'cover', backgroundPosition:'center', backgroundRepeat:'no-repeat' }
    : { background:'radial-gradient(ellipse at 60% 40%, #2a0030 0%, #080010 70%)' };

  return (
    <div
      className="ad-bg-section"
      style={{ ...bgStyle, position:'relative' }}
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




function detectPlatform(url) {
  if (!url) return null;
  if (/spotify\.com/i.test(url))  return 'spotify';
  if (/youtu\.be|youtube\.com/i.test(url)) return 'youtube';
  return null;
}


function toEmbedUrl(url) {
  if (!url) return null;

  
  const spotifyMatch = url.match(/spotify\.com\/(track|album|playlist|episode)\/([A-Za-z0-9]+)/);
  if (spotifyMatch) {
    return `https://open.spotify.com/embed/${spotifyMatch[1]}/${spotifyMatch[2]}?utm_source=generator&theme=0`;
  }

  
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([A-Za-z0-9_-]{11})/);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`;
  }

  return null;
}

function BgMusicSection({ bgMusic, onSave, showToast }) {
  
  const [input,    setInput]    = useState(bgMusic || '');
  const [saved,    setSaved]    = useState(!!bgMusic);
  const [error,    setError]    = useState('');

  
  useEffect(() => {
    setInput(bgMusic || '');
    setSaved(!!bgMusic);
  }, [bgMusic]);

  const platform  = detectPlatform(saved ? bgMusic : input);
  const embedUrl  = saved ? toEmbedUrl(bgMusic) : null;

  const platformIcon = platform === 'spotify'
    ? '🟢' : platform === 'youtube' ? '▶️' : '🎵';

  const platformLabel = platform === 'spotify'
    ? 'Spotify' : platform === 'youtube' ? 'YouTube' : '';

  const handleSave = () => {
    const trimmed = input.trim();
    if (!trimmed) { setError('Please paste a link first.'); return; }
    const p = detectPlatform(trimmed);
    if (!p) { setError('Only Spotify and YouTube links are supported.'); return; }
    if (!toEmbedUrl(trimmed)) { setError('Could not parse the link. Try the share/copy-link URL.'); return; }
    setError('');
    onSave(trimmed);
    setSaved(true);
    showToast('Music link saved!');
  };

  const handleRemove = () => {
    setInput('');
    setSaved(false);
    setError('');
    onSave(null);
    showToast('Music removed.');
  };

  const handleChange = (e) => {
    setInput(e.target.value);
    setSaved(false);
    setError('');
  };

  const s = bgMusicStyles;

  return (
    <div style={s.root}>
      {}
      <div style={s.card}>
        <div style={s.iconWrap}>
          <span style={{ fontSize: 26 }}>🎶</span>
        </div>
        <div style={s.info}>
          <div style={s.heading}>Background Music</div>
          <div style={s.subText}>
            Paste a <strong>Spotify</strong> or <strong>YouTube</strong> song link.
            It will play softly in the background when your love opens the page.
          </div>

          {}
          {saved && bgMusic && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
              <div style={s.trackRow}>
                <span style={s.trackName}>{platformIcon} {platformLabel} · linked</span>
                <button style={s.removeBtn} onClick={handleRemove}>✕ Remove</button>
              </div>
              {embedUrl && (
                <div style={s.embedWrap}>
                  <iframe
                    src={embedUrl}
                    width="100%"
                    height={platform === 'spotify' ? 80 : 120}
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    title="Music preview"
                    style={{ borderRadius: 12, border: 'none', display: 'block' }}
                  />
                </div>
              )}
            </div>
          )}

          {}
          {!saved && !input && (
            <div style={s.emptyHint}>No music linked yet</div>
          )}
        </div>
      </div>

      {}
      <div style={s.inputRow}>
        <div style={s.inputWrap}>
          <span style={s.inputIcon}>🔗</span>
          <input
            style={s.linkInput}
            type="url"
            placeholder="https://open.spotify.com/track/… or https://youtu.be/…"
            value={input}
            onChange={handleChange}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
          {input && (
            <button
              style={s.clearBtn}
              onClick={() => { setInput(''); setSaved(false); setError(''); }}
              title="Clear"
              aria-label="Clear input"
            >✕</button>
          )}
        </div>
        <button style={s.uploadBtn} onClick={handleSave}>
          Save Link
        </button>
      </div>

      {error && <div style={s.errorText}>{error}</div>}
      <div style={s.formatHint}>Supports Spotify tracks, playlists, albums · YouTube videos &amp; shorts</div>
    </div>
  );
}

const bgMusicStyles = {
  root: {
    padding: '28px 24px',
    background: '#f8f9fb',
    borderTop: '1px solid #e8eaed',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 14,
  },
  card: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
    background: '#ffffff',
    border: '1px solid #e8eaed',
    borderRadius: 16,
    padding: '20px',
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
  iconWrap: {
    width: 52, height: 52,
    borderRadius: 14,
    background: '#fce4ec',
    border: '1px solid #f48fb130',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  info: { flex: 1, display: 'flex', flexDirection: 'column', gap: 5 },
  heading: {
    fontSize: '0.98rem', fontWeight: 700,
    color: '#1a1a2e',
  },
  subText: {
    fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.6,
  },
  trackRow: {
    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
  },
  trackName: {
    fontSize: '0.83rem', color: '#e91e8c',
    background: '#fce4ec', border: '1px solid #f48fb140',
    borderRadius: 20, padding: '4px 12px', fontWeight: 500,
  },
  emptyHint: {
    fontSize: '0.82rem', color: '#9ca3af', fontStyle: 'italic', marginTop: 2,
  },
  embedWrap: {
    width: '100%', borderRadius: 12, overflow: 'hidden',
  },
  removeBtn: {
    background: '#fee2e2', border: '1px solid #fca5a540',
    color: '#dc2626', borderRadius: 20, padding: '4px 11px',
    fontSize: '0.78rem', cursor: 'pointer', fontWeight: 500,
  },
  
  inputRow: {
    display: 'flex', gap: 10, width: '100%', alignItems: 'center', flexWrap: 'wrap',
  },
  inputWrap: {
    flex: 1, minWidth: 220,
    display: 'flex', alignItems: 'center',
    background: '#fff', border: '1px solid #e8eaed',
    borderRadius: 50, padding: '0 14px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    gap: 8,
  },
  inputIcon: {
    fontSize: 14, flexShrink: 0, userSelect: 'none',
  },
  linkInput: {
    flex: 1, border: 'none', outline: 'none',
    padding: '11px 0',
    fontSize: '0.88rem', color: '#1a1a2e',
    background: 'transparent',
    fontFamily: 'system-ui, sans-serif',
  },
  clearBtn: {
    background: 'none', border: 'none',
    color: '#9ca3af', cursor: 'pointer',
    fontSize: '0.8rem', padding: '2px 4px',
    lineHeight: 1, flexShrink: 0,
  },
  uploadBtn: {
    background: '#e91e8c',
    border: 'none', borderRadius: 50,
    color: '#fff', fontSize: '0.9rem', fontWeight: 600,
    padding: '11px 26px', cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(233,30,140,0.25)',
    whiteSpace: 'nowrap',
    transition: 'opacity 0.2s',
  },
  errorText: {
    fontSize: '0.8rem', color: '#dc2626',
    background: '#fee2e2', border: '1px solid #fca5a540',
    borderRadius: 8, padding: '7px 12px',
  },
  formatHint: {
    fontSize: '0.75rem', color: '#9ca3af',
  },
};


function QrSection({ siteUrl, showToast }) {
  const handleDownload = () => {
    const svg = document.getElementById('admin-qr-svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 300, 300);
      ctx.drawImage(img, 0, 0, 300, 300);
      const link = document.createElement('a');
      link.download = 'lovegift-qr.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
  };

  return (
    <div style={{
      padding: '28px 24px',
      background: '#f8f9fb',
      borderTop: '1px solid #e8eaed',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 20,
    }}>
      {}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e8eaed',
        borderRadius: 16,
        padding: '20px',
        width: '100%',
        boxSizing: 'border-box',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
      }}>
        <div style={{
          width: 52, height: 52,
          borderRadius: 14,
          background: '#fce4ec',
          border: '1px solid rgba(244,143,177,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <QrCode size={24} color="#e91e8c" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#1a1a2e', marginBottom: 4 }}>
            Love Page QR Code
          </div>
          <div style={{ fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.6 }}>
            Share this QR code so your special person can open the love page instantly by scanning it.
          </div>
        </div>
      </div>

      {}
      <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{
          background: '#ffffff',
          padding: 12,
          borderRadius: 14,
          border: '1px solid #e8eaed',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <QRCodeSVG
            id="admin-qr-svg"
            value={siteUrl}
            size={150}
            fgColor="#1a1a2e"
            bgColor="#ffffff"
            level="H"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 2 }}>
            Your love page URL:
          </div>
          <code style={{
            background: '#f8f9fb',
            border: '1px solid #e8eaed',
            borderRadius: 8,
            padding: '6px 12px',
            fontSize: '0.82rem',
            color: '#1a1a2e',
            wordBreak: 'break-all',
          }}>
            {siteUrl}
          </code>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            <button
              onClick={() => { navigator.clipboard.writeText(siteUrl).catch(() => {}); showToast('Link copied!'); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 20,
                border: '1px solid rgba(124,58,237,0.25)',
                background: 'rgba(124,58,237,0.08)',
                color: '#7c3aed', cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: 500,
              }}
            >
              <Copy size={13} /> Copy Link
            </button>

            <button
              onClick={handleDownload}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 20,
                border: '1px solid rgba(233,30,140,0.25)',
                background: 'rgba(233,30,140,0.08)',
                color: '#e91e8c', cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: 500,
              }}
            >
              <QrCode size={13} /> Download QR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
