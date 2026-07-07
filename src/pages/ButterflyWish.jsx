import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { EditableText } from '../components/EditableField';
import { useImageUrl } from '../utils/useImageUrl';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/pages/ButterflyWish.css';

const DEFAULT_WISHES = [
  { 
    id: 1, 
    to: 'Crush',
    title: 'Dear crush, you are so beautiful', 
    message: 'That every time I see you, the world stops and all that exists for me is you and my eyes staring in admiration.' 
  },
  { 
    id: 2, 
    to: 'My Love',
    title: 'You are my everything', 
    message: 'Every moment with you is a treasure. You make my heart sing and my soul dance with joy.' 
  },
];

export default function ButterflyWish({ isEditing = false, onContentChange }) {
  const navigate = useNavigate();
  const { coupleAuth, getCoupleBySlug, myCouple } = useApp();
  const couple = isEditing ? myCouple : getCoupleBySlug(coupleAuth?.slug);
  const gradientId = isEditing ? 'hg-edit' : 'hg-view';

  const pc = couple?.pageContent?.wishPage || {};
  const title = pc.title ?? 'Wishes';
  const sub = pc.subtitle ?? 'Click the envelope to reveal your wishes';
  
  const wishes = couple?.pageContent?.wishes?.length >= 2 
    ? couple.pageContent.wishes.slice(0, 2)
    : DEFAULT_WISHES;

  const savePC = (field, val) => onContentChange?.('wishPage', { ...pc, [field]: val });
  const saveWish = (id, field, val) => {
    const updated = wishes.map(w => w.id === id ? { ...w, [field]: val } : w);
    onContentChange?.('wishes', updated);
  };

  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState(null);

  const bgKey = pc.bgImage;
  const bgUrl = useImageUrl(bgKey);

  const bgStyle = bgUrl ? {
    backgroundImage: `url(${bgUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  } : isEditing ? { background: 'transparent' } : undefined;

  return (
    <div className={`bw-root${isEditing ? ' bw-root--editing' : ''}`} style={bgStyle}>
      {!isEditing && (
        <button className="bw-back" onClick={() => navigate('/butterflies360')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </button>
      )}

      <motion.header 
        className="bw-header"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <EditableText
          as="h1"
          className="bw-title"
          value={title}
          isEditing={isEditing}
          onChange={v => savePC('title', v)}
          style={pc.style_title || {}}
          onStyleSave={st => savePC('style_title', st)}
        />
        <EditableText
          as="p"
          className="bw-subtitle"
          value={sub}
          isEditing={isEditing}
          onChange={v => savePC('subtitle', v)}
          style={pc.style_subtitle || {}}
          onStyleSave={st => savePC('style_subtitle', st)}
        />
      </motion.header>

      <div className="bw-single-envelope-container">
        {}
        <motion.div 
          className="bw-envelope-scene"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div 
            className={`bw-envelope ${isEnvelopeOpen ? 'open' : ''}`}
            onClick={() => !isEditing && setIsEnvelopeOpen(!isEnvelopeOpen)}
            whileHover={!isEnvelopeOpen ? { y: -8 } : {}}
          >
            {}
            <svg className="bw-envelope-svg" viewBox="0 0 650 380" xmlns="http://www.w3.org/2000/svg">
              {}
              <rect x="0" y="0" width="650" height="380" rx="10" fill="#ffb3c6"/>

              {}
              <line x1="2" y1="2" x2="325" y2="195" stroke="#f48fb1" strokeWidth="1.2" opacity="0.7"/>
              <line x1="648" y1="2" x2="325" y2="195" stroke="#f48fb1" strokeWidth="1.2" opacity="0.7"/>

              {}
              <text x="120" y="160" fontSize="14" fill="#f48fb1" opacity="0.35" fontFamily="serif">♥</text>
              <text x="510" y="140" fontSize="12" fill="#f48fb1" opacity="0.3" fontFamily="serif">♥</text>
            </svg>

            {}
            <div className="bw-heart-seal">
              <svg viewBox="0 0 80 76" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id={gradientId} cx="40%" cy="28%" r="62%">
                    <stop offset="0%"   stopColor="#ff80ab"/>
                    <stop offset="40%"  stopColor="#f50057"/>
                    <stop offset="100%" stopColor="#b2003f"/>
                  </radialGradient>
                </defs>
                <path d="M40 68 C40 68 5 44 5 22 C5 10 14 3 23 3 C29 3 35 7 40 13 C45 7 51 3 57 3 C66 3 75 10 75 22 C75 44 40 68 40 68Z"
                  fill={`url(#${gradientId})`}/>
                {}
                <ellipse cx="29" cy="17" rx="8" ry="5.5" fill="rgba(255,255,255,0.45)" transform="rotate(-20 29 17)"/>
                <ellipse cx="32" cy="22" rx="3" ry="2" fill="rgba(255,255,255,0.2)" transform="rotate(-20 32 22)"/>
              </svg>
            </div>

            {}
            <div className="bw-envelope-front" />

            {}
            <motion.div
              className="bw-flap-top"
              animate={{ rotateX: isEnvelopeOpen ? 180 : 0 }}
              transition={{ duration: 0.8, ease: [0.68, -0.55, 0.265, 1.55] }}
              style={{ transformOrigin: '50% 0%' }}
            />

            {}
            {!isEditing && (
              <motion.div 
                className="bw-two-letters"
                animate={{ y: isEnvelopeOpen ? '-40%' : '0%' }}
                transition={{ duration: 0.8, ease: [0.68, -0.55, 0.265, 1.55] }}
              >
                {wishes.map((wish, index) => (
                  <motion.div
                    key={wish.id}
                    className="bw-letter-preview"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isEnvelopeOpen) setSelectedLetter(wish);
                    }}
                    whileHover={isEnvelopeOpen ? { y: -8, scale: 1.05 } : {}}
                  >
                    <div className="bw-letter-preview-number">#{index + 1}</div>
                    <h4 className="bw-letter-preview-title">{wish.title}</h4>
                    {isEnvelopeOpen && (
                      <div className="bw-letter-preview-hint">Click to read</div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}

            {}
            {!isEditing && isEnvelopeOpen && (
              <div className="bw-floating-hearts">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="bw-heart-float"
                    animate={{
                      y: [0, -200],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.5,
                    }}
                    style={{ left: `${25 + i * 25}%` }}
                  >
                    ♥
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {}
      {isEditing && (
        <div className="bw-edit-cards">
          {wishes.map((wish, index) => (
            <div key={wish.id} className="bw-edit-card">
              <div className="bw-edit-card-label">Letter #{index + 1}</div>
              <div className="bw-edit-card-row">
                <span className="bw-edit-card-field-label">To</span>
                <EditableText
                  as="span"
                  className="bw-edit-card-to"
                  value={wish.to}
                  isEditing={isEditing}
                  onChange={v => saveWish(wish.id, 'to', v)}
                  style={wish.style_to || {}}
                  onStyleSave={st => saveWish(wish.id, 'style_to', st)}
                />
              </div>
              <div className="bw-edit-card-row">
                <span className="bw-edit-card-field-label">Title</span>
                <EditableText
                  as="span"
                  className="bw-edit-card-title"
                  value={wish.title}
                  isEditing={isEditing}
                  onChange={v => saveWish(wish.id, 'title', v)}
                  style={wish.style_title || {}}
                  onStyleSave={st => saveWish(wish.id, 'style_title', st)}
                />
              </div>
              <div className="bw-edit-card-row bw-edit-card-row--message">
                <span className="bw-edit-card-field-label">Message</span>
                <EditableText
                  as="span"
                  className="bw-edit-card-message"
                  value={wish.message}
                  isEditing={isEditing}
                  onChange={v => saveWish(wish.id, 'message', v)}
                  style={wish.style_message || {}}
                  onStyleSave={st => saveWish(wish.id, 'style_message', st)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {}
      <AnimatePresence>
        {selectedLetter && (
          <motion.div
            className="bw-letter-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedLetter(null)}
          >
            <motion.div
              className="bw-letter-full"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="bw-letter-close" onClick={() => setSelectedLetter(null)}>✕</button>
              <div className="bw-letter-to">To: {selectedLetter.to}</div>
              <h3 className="bw-letter-title-full">{selectedLetter.title}</h3>
              <div className="bw-letter-divider" />
              <p className="bw-letter-message-full">{selectedLetter.message}</p>
              <div className="bw-letter-signature">♥</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
