import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useMusic } from '../context/MusicContext';
import { EditableText } from '../components/EditableField';
import '../styles/pages/ButterflyStory.css';

const DEFAULT_SONGS = [
  { id: 1, title: 'Perfect', artist: 'Ed Sheeran', reason: 'Our first dance song', albumBg: 'linear-gradient(135deg,#c97b84,#f2b8c0)', spotifyId: '0tgVpDi06FyKpA1z0VMD4v', youtubeId: '2Vv-BfVoq4g', lyrics: `I found a love for me\nDarling just dive right in and follow my lead` },
  { id: 2, title: 'The Most Beautiful Thing', artist: 'Bruno Major', reason: 'Reminds me of your smile', albumBg: 'linear-gradient(135deg,#7a1a2a,#c0455a)', spotifyId: '3R4X58uFNgJuaplbpFRSry', youtubeId: null, lyrics: '' },
  { id: 3, title: 'Right Side of My Heart', artist: 'Tenille Townes', reason: 'Tattooed on my soul', albumBg: 'linear-gradient(135deg,#5a4a3a,#9a7a6a)', spotifyId: '1N22A16DFUMbQOXfVeHhAZ', youtubeId: null, lyrics: '' },
];


const ALBUM_GRADIENTS = [
  'linear-gradient(135deg,#c97b84,#f2b8c0)',
  'linear-gradient(135deg,#7a1a2a,#c0455a)',
  'linear-gradient(135deg,#5a4a3a,#9a7a6a)',
  'linear-gradient(135deg,#3a4a7a,#6a8ac0)',
  'linear-gradient(135deg,#4a7a3a,#8ac06a)',
  'linear-gradient(135deg,#7a5a3a,#c09a6a)',
  'linear-gradient(135deg,#5a3a7a,#9a6ac0)',
];


function parseUrl(raw) {
  const url = raw.trim();
  const spMatch = url.match(/spotify\.com\/track\/([A-Za-z0-9]+)/) ||
                  url.match(/spotify:track:([A-Za-z0-9]+)/);
  if (spMatch) return { type: 'spotify', id: spMatch[1] };
  const ytMatch = url.match(/youtu\.be\/([A-Za-z0-9_-]+)/) ||
                  url.match(/youtube\.com\/watch\?v=([A-Za-z0-9_-]+)/) ||
                  url.match(/youtube\.com\/embed\/([A-Za-z0-9_-]+)/);
  if (ytMatch) return { type: 'youtube', id: ytMatch[1] };
  return null;
}


async function fetchSongMeta(raw) {
  const parsed = parseUrl(raw);
  if (!parsed) throw new Error('Unrecognised URL — paste a Spotify track or YouTube link.');

  if (parsed.type === 'spotify') {
    const res = await fetch(
      `https://open.spotify.com/oembed?url=https://open.spotify.com/track/${parsed.id}`
    );
    if (!res.ok) throw new Error('Could not fetch Spotify info. Check the link.');
    const data = await res.json();
    const rawTitle = data.title || '';
    const dashIdx  = rawTitle.lastIndexOf(' - ');
    const title    = dashIdx > -1 ? rawTitle.slice(0, dashIdx).trim() : rawTitle.trim();
    const artist   = dashIdx > -1 ? rawTitle.slice(dashIdx + 3).trim() : '';
    return { type: 'spotify', id: parsed.id, title, artist, thumbnail: data.thumbnail_url || '' };
  }

  if (parsed.type === 'youtube') {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${parsed.id}&format=json`
    );
    if (!res.ok) throw new Error('Could not fetch YouTube info. Check the link.');
    const data = await res.json();
    return { type: 'youtube', id: parsed.id, title: data.title || '', artist: data.author_name || '', thumbnail: data.thumbnail_url || '' };
  }
}


function SpotifyIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}


function PlayBtn({ isActive }) {
  return (
    <div className={`bs-play-btn ${isActive ? 'bs-play-btn--active' : ''}`}>
      {isActive ? (
        <div className="bs-pause-bars">
          <span /><span />
        </div>
      ) : (
        <div className="bs-play-triangle" />
      )}
    </div>
  );
}


function SongCard({ song, isActive, onClick, isEditing, onDelete, onReplace }) {
  const [replacing, setReplacing] = useState(false);
  const [replaceUrl, setReplaceUrl] = useState('');
  const [replaceLoading, setReplaceLoading] = useState(false);
  const [replaceError, setReplaceError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const handleReplace = async () => {
    if (!replaceUrl.trim()) return;
    setReplaceLoading(true);
    setReplaceError('');
    try {
      const meta = await fetchSongMeta(replaceUrl);
      onReplace({
        ...song,
        title:     meta.title,
        artist:    meta.artist,
        spotifyId: meta.type === 'spotify' ? meta.id : null,
        youtubeId: meta.type === 'youtube' ? meta.id : null,
      });
      setReplacing(false);
      setReplaceUrl('');
    } catch (e) {
      setReplaceError(e.message);
    } finally {
      setReplaceLoading(false);
    }
  };

  return (
    <div className={`bs-song-card ${isActive ? 'bs-song-card--active' : ''} ${isEditing ? 'bs-song-card--editing' : ''}`}>
      {}
      <div className="bs-song-card-inner" onClick={!isEditing ? onClick : undefined}>
        {}
        <div className="bs-album-art" style={{ background: song.albumBg }}>
          {isActive && !isEditing && (
            <div className="bs-album-overlay">
              <div className="bs-mini-bars">
                <span className="bs-mbar bs-mbar-0" />
                <span className="bs-mbar bs-mbar-1" />
                <span className="bs-mbar bs-mbar-2" />
              </div>
            </div>
          )}
        </div>

        {}
        <div className="bs-card-info">
          <div className="bs-card-top">
            <span className="bs-card-title">{song.title}</span>
            <SpotifyIcon size={13} />
          </div>
          <div className="bs-card-artist">{song.artist}</div>
          <div className="bs-card-bottom">
            <SpotifyIcon size={11} />
            <span className="bs-card-reason">{song.reason}</span>
          </div>
        </div>

        {}
        <div className="bs-card-right">
          {isEditing ? (
            <div className="bs-card-edit-btns">
              {}
              <button
                className={`bs-card-play-btn ${showPreview ? 'bs-card-play-btn--active' : ''}`}
                onClick={e => { e.stopPropagation(); setShowPreview(v => !v); }}
                title={showPreview ? 'Hide preview' : 'Preview song'}
              >
                {showPreview
                  ? <span className="bs-card-pause-icon">❚❚</span>
                  : <span className="bs-card-play-icon">▶</span>
                }
              </button>
              <button
                className="bs-card-replace-btn"
                onClick={e => { e.stopPropagation(); setReplacing(r => !r); setReplaceError(''); }}
                title="Replace song"
              >✎</button>
              <button
                className="bs-card-del-btn"
                onClick={e => { e.stopPropagation(); onDelete(); }}
                title="Remove song"
              >✕</button>
            </div>
          ) : (
            <>
              <div className="bs-dots">···</div>
              <PlayBtn isActive={isActive} />
            </>
          )}
        </div>
      </div>

      {}
      {isEditing && showPreview && song.spotifyId && (
        <div className="bs-card-preview-wrap">
          <iframe
            key={song.spotifyId}
            src={`https://open.spotify.com/embed/track/${song.spotifyId}?utm_source=generator&theme=0`}
            width="100%"
            height="80"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="bs-spotify-frame"
          />
        </div>
      )}
      {isEditing && showPreview && song.youtubeId && !song.spotifyId && (
        <div className="bs-card-preview-wrap">
          <iframe
            src={`https://www.youtube.com/embed/${song.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
            title={song.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="bs-video"
          />
        </div>
      )}
      {}
      {isEditing && replacing && (
        <div className="bs-card-replace-row" onClick={e => e.stopPropagation()}>
          <input
            className="bs-card-replace-input"
            placeholder="Paste new Spotify or YouTube link…"
            value={replaceUrl}
            autoFocus
            onChange={e => { setReplaceUrl(e.target.value); setReplaceError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleReplace()}
          />
          <button
            className="bs-card-replace-confirm"
            onClick={handleReplace}
            disabled={replaceLoading || !replaceUrl.trim()}
          >{replaceLoading ? '…' : '→'}</button>
          <button
            className="bs-card-replace-cancel"
            onClick={() => { setReplacing(false); setReplaceUrl(''); setReplaceError(''); }}
          >✕</button>
          {replaceError && <div className="bs-card-replace-error">{replaceError}</div>}
        </div>
      )}
    </div>
  );
}


function VinylRecord() {
  return (
    <svg className="bs-vinyl-svg" viewBox="0 0 240 240" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="vg" cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stopColor="#2a2a2a" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </radialGradient>
        <radialGradient id="labelG" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#b03030" />
          <stop offset="100%" stopColor="#7a1010" />
        </radialGradient>
      </defs>
      {}
      <circle cx="120" cy="120" r="118" fill="url(#vg)" />
      {}
      {[108,100,92,84,76,68,60,52,46].map(r=>(
        <circle key={r} cx="120" cy="120" r={r}
          fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5"/>
      ))}
      {}
      <ellipse cx="90" cy="75" rx="40" ry="22"
        fill="rgba(255,255,255,0.055)" transform="rotate(-25 90 75)"/>
      {}
      <circle cx="120" cy="120" r="38" fill="url(#labelG)"/>
      <circle cx="120" cy="120" r="36" fill="none"
        stroke="rgba(255,255,255,0.1)" strokeWidth="0.8"/>
      {}
      <circle cx="120" cy="120" r="5" fill="#ddd"/>
      <circle cx="120" cy="120" r="3" fill="#fff" opacity="0.9"/>
      {}
      <circle cx="120" cy="120" r="118" fill="none"
        stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
    </svg>
  );
}


function LaceBorder() {
  return (
    <svg className="bs-lace-svg" viewBox="0 0 48 400" preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="laceP" x="0" y="0" width="48" height="24" patternUnits="userSpaceOnUse">
          {}
          <path d="M0,0 Q12,18 24,8 Q36,18 48,0" fill="rgba(240,230,210,0.55)" stroke="rgba(220,200,170,0.3)" strokeWidth="0.5"/>
          {}
          <circle cx="12" cy="14" r="2.5" fill="rgba(240,230,210,0.35)"/>
          <circle cx="36" cy="14" r="2.5" fill="rgba(240,230,210,0.35)"/>
          <circle cx="24" cy="4"  r="2"   fill="rgba(240,230,210,0.25)"/>
          {}
          <path d="M24,8 L27,11 L24,14 L21,11 Z" fill="rgba(240,230,210,0.2)"/>
        </pattern>
      </defs>
      <rect width="48" height="400" fill="url(#laceP)"/>
    </svg>
  );
}


function GinghamEdge() {
  return (
    <svg className="bs-gingham-svg" viewBox="0 0 220 80" preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="gingham" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill="#c0392b"/>
          <rect width="6" height="6" fill="rgba(255,255,255,0.25)"/>
          <rect x="6" y="6" width="6" height="6" fill="rgba(255,255,255,0.25)"/>
          <rect width="6" height="12" fill="rgba(255,255,255,0.1)"/>
          <rect height="6" width="12" fill="rgba(255,255,255,0.1)"/>
        </pattern>
      </defs>
      {}
      <path d="M0,30 Q10,18 20,26 Q30,34 40,22 Q50,10 60,20 Q70,30 80,18 Q90,6 100,16 Q110,26 120,14 Q130,2 140,12 Q150,22 160,10 Q170,0 180,10 Q190,20 200,10 Q210,2 220,12 L220,80 L0,80 Z"
        fill="url(#gingham)" opacity="0.85"/>
    </svg>
  );
}


function SongManager({ songs, onChange }) {
  const [url, setUrl]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [editReason, setEditReason] = useState({}); 
  const gradientRef = useRef(0);

  const handleAdd = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    try {
      const meta = await fetchSongMeta(url);
      const gradient = ALBUM_GRADIENTS[gradientRef.current % ALBUM_GRADIENTS.length];
      gradientRef.current += 1;
      const newSong = {
        title:    meta.title,
        artist:   meta.artist,
        reason:   '',
        albumBg:  gradient,
        spotifyId: meta.type === 'spotify' ? meta.id : null,
        youtubeId: meta.type === 'youtube' ? meta.id : null,
        lyrics:   '',
      };
      onChange([...songs, newSong]);
      setUrl('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (idx) => {
    onChange(songs.filter((_, i) => i !== idx));
  };

  const handleReasonChange = (idx, val) => {
    const updated = songs.map((s, i) => i === idx ? { ...s, reason: val } : s);
    onChange(updated);
  };

  return (
    <div className="bs-manager">
      <div className="bs-manager-title">🎵 Manage Songs</div>

      {}
      <div className="bs-manager-row">
        <input
          className="bs-manager-input"
          placeholder="Paste Spotify or YouTube link…"
          value={url}
          onChange={e => { setUrl(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button
          className="bs-manager-add-btn"
          onClick={handleAdd}
          disabled={loading || !url.trim()}
        >
          {loading ? '…' : '+ Add Song'}
        </button>
      </div>
      {error && <div className="bs-manager-error">⚠ {error}</div>}

      {}
      <div className="bs-manager-list">
        {songs.length === 0 && (
          <div className="bs-manager-empty">No songs yet. Paste a link above to add one.</div>
        )}
        {songs.map((s, i) => (
          <div key={i} className="bs-manager-item">
            {}
            <div className="bs-manager-swatch" style={{ background: s.albumBg }} />
            {}
            <div className="bs-manager-info">
              <span className="bs-manager-song-title">{s.title || '—'}</span>
              <span className="bs-manager-artist">{s.artist || ''}</span>
              {}
              <input
                className="bs-manager-reason"
                placeholder="Why this song? (optional)"
                value={editReason[i] ?? s.reason ?? ''}
                onChange={e => {
                  setEditReason(r => ({ ...r, [i]: e.target.value }));
                  handleReasonChange(i, e.target.value);
                }}
              />
            </div>
            {}
            <span className="bs-manager-platform">
              {s.spotifyId ? '🟢 Spotify' : s.youtubeId ? '🔴 YouTube' : ''}
            </span>
            {}
            <button
              className="bs-manager-del"
              onClick={() => handleDelete(i)}
              title="Remove song"
            >✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}


export default function ButterflyStory({ isEditing = false, onContentChange }) {
  const navigate = useNavigate();
  const { coupleAuth, getCoupleBySlug, myCouple } = useApp();
  const music = useMusic();
  
  const couple = isEditing ? myCouple : getCoupleBySlug(coupleAuth?.slug);

  const pc    = couple?.pageContent?.storyPage || {};
  
  const songs = isEditing
    ? (couple?.songs || [])
    : (couple?.songs?.length ? couple.songs : DEFAULT_SONGS);

  const t1 = pc.boardTitle1 ?? 'Songs';
  const t2 = pc.boardTitle2 ?? 'that';
  const t3 = pc.boardTitle3 ?? 'Remind Me of You';
  const savePC = (field, val) => onContentChange?.('storyPage', { ...pc, [field]: val });
  const saveSongs = (list) => onContentChange?.('songs', list);

  const [activeIdx, setActiveIdx] = useState(0);
  const [showLyrics, setShowLyrics] = useState(false);
  
  const safeIdx = songs.length > 0 ? Math.min(activeIdx, songs.length - 1) : 0;
  const active = songs[safeIdx] || null;

  // Pause background music when a YouTube video is active
  useEffect(() => {
    if (!isEditing && active?.youtubeId && music) {
      music.pause();
    }
  }, [active, isEditing, music]);

  return (
    <div className="bs-root">
      {!isEditing && (
        <button className="bs-back" onClick={() => navigate('/butterflies360')}>← Back</button>
      )}

      {}
      <div className="bs-frame">

        {}
        <div className="bs-board">

          {}
          <div className="bs-lace-wrap">
            <LaceBorder />
          </div>

          {}
          <div className="bs-gingham-wrap">
            <GinghamEdge />
          </div>

          {}
          <div className="bs-stickers">
            {}
            <div className="bs-sticker-heart">
              <svg viewBox="0 0 60 56" width="52" height="48">
                <defs>
                  <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#e0e0e0"/>
                    <stop offset="40%" stopColor="#a0a0a0"/>
                    <stop offset="100%" stopColor="#707070"/>
                  </linearGradient>
                </defs>
                <path d="M30 50 C30 50 4 33 4 17 C4 8 11 3 18 3 C23 3 28 6 30 11 C32 6 37 3 42 3 C49 3 56 8 56 17 C56 33 30 50 30 50Z"
                  fill="url(#hg)" stroke="rgba(160,160,160,0.4)" strokeWidth="0.5"/>
                <path d="M30 44 C30 44 8 30 8 17 C8 11 13 7 18 7 C23 7 27 10 30 15"
                  fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>

            {}
            <div className="bs-sticker-cassettes">
              <svg viewBox="0 0 70 55" width="68" height="52">
                {}
                <g transform="rotate(-15 35 28) translate(6,6)">
                  <rect width="52" height="32" rx="4" fill="#2a2a2a" stroke="#444" strokeWidth="0.8"/>
                  <rect x="4" y="4" width="44" height="24" rx="2" fill="#1a1a1a"/>
                  <circle cx="16" cy="16" r="6" fill="#333" stroke="#555" strokeWidth="0.8"/>
                  <circle cx="36" cy="16" r="6" fill="#333" stroke="#555" strokeWidth="0.8"/>
                  <rect x="20" y="13" width="12" height="6" rx="1" fill="#444"/>
                </g>
                {}
                <g transform="translate(4,14)">
                  <rect width="52" height="32" rx="4" fill="#1e1e1e" stroke="#555" strokeWidth="0.8"/>
                  <rect x="4" y="4" width="44" height="24" rx="2" fill="#111"/>
                  <circle cx="16" cy="16" r="6" fill="#2a2a2a" stroke="#666" strokeWidth="0.8"/>
                  <circle cx="36" cy="16" r="6" fill="#2a2a2a" stroke="#666" strokeWidth="0.8"/>
                  <circle cx="16" cy="16" r="2.5" fill="#888"/>
                  <circle cx="36" cy="16" r="2.5" fill="#888"/>
                  <rect x="20" y="13" width="12" height="6" rx="1" fill="#3a3a3a"/>
                  <rect x="6" y="7" width="16" height="4" rx="1" fill="rgba(200,60,60,0.6)"/>
                </g>
              </svg>
            </div>

            {}
            <div className="bs-sticker-camera">
              <svg viewBox="0 0 64 50" width="60" height="46">
                <rect x="4" y="12" width="56" height="34" rx="5" fill="#3a3a3a" stroke="#555" strokeWidth="0.8"/>
                <rect x="8" y="16" width="48" height="26" rx="3" fill="#2a2a2a"/>
                <path d="M22,8 L28,14 L42,14 L46,8 Z" fill="#3a3a3a" stroke="#555" strokeWidth="0.8"/>
                <circle cx="32" cy="29" r="10" fill="#1a1a1a" stroke="#666" strokeWidth="1"/>
                <circle cx="32" cy="29" r="7"  fill="#0a0a0a" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8"/>
                <circle cx="32" cy="29" r="3"  fill="#333"/>
                <ellipse cx="28" cy="25" rx="2" ry="1.5" fill="rgba(255,255,255,0.15)" transform="rotate(-30 28 25)"/>
                <rect x="48" y="17" width="7" height="5" rx="1" fill="#555"/>
                <circle cx="12" cy="19" r="3" fill="#888"/>
                <circle cx="12" cy="19" r="1.5" fill="#aaa"/>
              </svg>
            </div>

            {}
            <div className="bs-sticker-teddy">🧸</div>

            {}
            <div className="bs-sticker-strawberry">🍓🍓</div>
          </div>

          {}
          <div className="bs-center">
            <div className="bs-title-block">
              <div className="bs-title-row1">
                <EditableText as="span" className="bs-title-italic"
                  value={t1} isEditing={isEditing} onChange={v => savePC('boardTitle1', v)}/>
                <EditableText as="span" className="bs-title-that"
                  value={` ${t2}`} isEditing={isEditing} onChange={v => savePC('boardTitle2', v.trim())}/>
              </div>
              <EditableText as="div" className="bs-title-row2"
                value={t3} isEditing={isEditing} onChange={v => savePC('boardTitle3', v)}/>
            </div>

            <div className="bs-song-list">
              {songs.length === 0 && isEditing && (
                <div className="bs-song-list-empty">No songs added yet — use the manager below ↓</div>
              )}
              {songs.map((s, i) => (
                s.spotifyId ? (
                  
                  <div key={i} className={`bs-embed-row ${activeIdx === i ? 'bs-embed-row--active' : ''}`}>
                    <iframe
                      src={`https://open.spotify.com/embed/track/${s.spotifyId}?utm_source=generator&theme=0`}
                      width="100%"
                      height="80"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="bs-spotify-frame"
                    />
                  </div>
                ) : (
                  
                  <SongCard
                    key={i}
                    song={s}
                    isActive={activeIdx === i}
                    onClick={() => { setActiveIdx(i); setShowLyrics(false); }}
                    isEditing={isEditing}
                    onDelete={() => {
                      const updated = songs.filter((_, idx) => idx !== i);
                      saveSongs(updated);
                      if (activeIdx >= updated.length) setActiveIdx(Math.max(0, updated.length - 1));
                    }}
                    onReplace={(newSong) => {
                      saveSongs(songs.map((x, idx) => idx === i ? newSong : x));
                    }}
                  />
                )
              ))}
            </div>

            {}
            {active?.lyrics && (
              <div className="bs-extras">
                <button className="bs-lyrics-btn" onClick={() => setShowLyrics(v => !v)}>
                  ♪ {showLyrics ? 'Hide Lyrics' : 'Show Lyrics'}
                </button>
                {showLyrics && (
                  <div className="bs-lyrics-box">
                    {active.lyrics.split('\n').map((l, i) =>
                      l === '' ? <div key={i} className="bs-lyric-gap"/> : <p key={i} className="bs-lyric-line">{l}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {}
            {!isEditing && active?.youtubeId && (
              <div className="bs-video-wrap">
                <iframe
                  src={`https://www.youtube.com/embed/${active.youtubeId}?rel=0&modestbranding=1`}
                  title={active.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen className="bs-video"
                />
              </div>
            )}
          </div>

          {}
          <div className="bs-vinyl-col">
            {}
            <div className="bs-lily">🌸</div>

            {}
            <div className="bs-polaroid">
              <VinylRecord />
            </div>

            {}
            <div className="bs-daisies">🌸🌷</div>
          </div>

        </div>{}
      </div>{}

      {}
      {isEditing && (
        <SongManager
          songs={couple?.songs?.length ? couple.songs : []}
          onChange={saveSongs}
        />
      )}
    </div>
  );
}
