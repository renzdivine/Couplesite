import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { EditableText } from '../components/EditableField';
import { useImageUrl } from '../utils/useImageUrl';
import '../styles/pages/ButterflyWish.css';

const DEFAULT_WISHES = [
  { id: 1, title: 'Always by your side', message: 'No matter where life takes us, I wish for you to always feel safe, loved, and never alone. I am your constant — in every season, in every storm.', unlocked: true },
  { id: 2, title: 'For every morning',   message: 'I wish you a life full of mornings that feel like beginnings — where you wake up knowing you are deeply loved, exactly as you are.', unlocked: true },
  { id: 3, title: 'A wish for our future', message: 'This one is sealed until our next anniversary. Some wishes are best kept close to the heart a little longer.', unlocked: false, unlockHint: 'Opens on our next anniversary' },
];

export default function ButterflyWish({ isEditing = false, onContentChange }) {
  const navigate  = useNavigate();
  const { coupleAuth, getCoupleBySlug, myCouple } = useApp();
  const couple    = isEditing ? myCouple : getCoupleBySlug(coupleAuth?.slug);

  const pc     = couple?.pageContent?.wishPage || {};
  const title  = pc.title    ?? 'Wishes';
  const sub    = pc.subtitle ?? 'Little wishes sent to you on butterfly wings';
  const wishes = couple?.pageContent?.wishes?.length ? couple.pageContent.wishes : DEFAULT_WISHES;

  const savePC  = (field, val) => onContentChange?.('wishPage',    { ...pc, [field]: val });
  const saveWish = (id, field, val) => {
    const updated = wishes.map(w => w.id === id ? { ...w, [field]: val } : w);
    onContentChange?.('wishes', updated);
  };

  const [revealed, setRevealed] = useState({});
  const reveal = id => setRevealed(prev => ({ ...prev, [id]: true }));

  // Resolve custom background image if set
  const bgKey = pc.bgImage;
  const bgUrl = useImageUrl(bgKey);

  const bgStyle = bgUrl ? {
    backgroundImage: `url(${bgUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  } : undefined;

  return (
    <div className="bw-root" style={bgStyle}>
      {!isEditing && (
        <button className="bw-back" onClick={() => navigate('/butterflies360')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </button>
      )}

      <header className="bw-header">
        <div className="bw-stars" aria-hidden="true"><StarField /></div>
        <EditableText as="h1" className="bw-title"
          value={title} isEditing={isEditing} onChange={v => savePC('title', v)}/>
        <EditableText as="p" className="bw-subtitle"
          value={sub} isEditing={isEditing} onChange={v => savePC('subtitle', v)}/>
      </header>

      <div className="bw-list">
        {wishes.map(wish => (
          <div
            key={wish.id}
            className={`bw-card ${!wish.unlocked ? 'bw-card--locked' : ''} ${revealed[wish.id] ? 'bw-card--revealed' : ''}`}
          >
            {wish.unlocked ? (
              <>
                {(!revealed[wish.id] && !isEditing) ? (
                  <button className="bw-seal" onClick={() => reveal(wish.id)} aria-label={`Open wish: ${wish.title}`}>
                    <div className="bw-seal-icon" aria-hidden="true">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/>
                        <path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                      </svg>
                    </div>
                    <span className="bw-seal-label">Open wish</span>
                  </button>
                ) : (
                  <div className="bw-wish-inner">
                    <EditableText as="h2" className="bw-wish-title"
                      value={wish.title} isEditing={isEditing}
                      onChange={v => saveWish(wish.id, 'title', v)}/>
                    <EditableText as="p" className="bw-wish-message"
                      value={wish.message} isEditing={isEditing} multiline
                      onChange={v => saveWish(wish.id, 'message', v)}/>
                  </div>
                )}
              </>
            ) : (
              <div className="bw-wish-inner">
                <div className="bw-lock-icon" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <EditableText as="h2" className="bw-wish-title"
                  value={wish.title} isEditing={isEditing}
                  onChange={v => saveWish(wish.id, 'title', v)}/>
                <EditableText as="p" className="bw-wish-hint"
                  value={wish.unlockHint || ''} isEditing={isEditing}
                  onChange={v => saveWish(wish.id, 'unlockHint', v)}/>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StarField() {
  // Alternating warm gold and rose sparkles for a romantic anniversary feel
  const sparkles = [
    {cx:10, cy:8,  r:1.3, gold:true},
    {cx:34, cy:4,  r:1.0, gold:false},
    {cx:56, cy:12, r:1.5, gold:true},
    {cx:80, cy:3,  r:0.9, gold:false},
    {cx:100,cy:10, r:1.2, gold:true},
    {cx:120,cy:5,  r:0.8, gold:false},
    {cx:20, cy:20, r:1.0, gold:false},
    {cx:45, cy:22, r:1.4, gold:true},
    {cx:70, cy:18, r:0.9, gold:false},
    {cx:90, cy:22, r:1.1, gold:true},
    {cx:110,cy:16, r:1.3, gold:false},
    {cx:130,cy:20, r:0.8, gold:true},
  ];
  return (
    <svg width="140" height="28" viewBox="0 0 140 28" fill="none">
      {sparkles.map((s, i) => (
        <circle
          key={i}
          cx={s.cx} cy={s.cy} r={s.r}
          fill={s.gold ? 'rgba(240,190,120,0.60)' : 'rgba(230,130,120,0.55)'}
        />
      ))}
    </svg>
  );
}
