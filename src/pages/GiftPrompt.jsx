import { useState } from 'react';
import { EditableText } from '../components/EditableField';
import '../styles/pages/GiftPrompt.css';

const GOMA_CAT_GIF     = 'https://media.tenor.com/Esi-teXJmyUAAAAm/laphie.webp';
const MOCHI_COUPLE_GIF = 'https://media1.tenor.com/m/6c7WSVdVFNoAAAAC/catie.gif';

export default function GiftPrompt({ couple, onAccept, isEditing = false, onContentChange }) {
  const [state, setState] = useState('ask');

  const pc          = couple?.pageContent?.giftPrompt || {};
  const askTitle    = pc.askTitle    ?? 'HEY BABY!';
  const askSub      = pc.askSub      ?? 'WOULD YOU LIKE TO SEE YOUR GIFT?';
  const pleaseTitle = pc.pleaseTitle ?? 'AW PLEASE?';
  const pleaseSub   = pc.pleaseSub   ?? 'I PREPARED THIS GIFT FOR YOU';

  const save = (field, val) => onContentChange?.({ ...pc, [field]: val });

  return (
    <div className="gp-root">

      {/* ── Editing tab switcher — lets admin preview/edit both states ── */}
      {isEditing && (
        <div className="gp-tab-bar">
          <button
            className={`gp-tab${state === 'ask' ? ' gp-tab--active' : ''}`}
            onClick={() => setState('ask')}
          >
            😺 Ask screen
          </button>
          <button
            className={`gp-tab${state === 'please' ? ' gp-tab--active' : ''}`}
            onClick={() => setState('please')}
          >
            🥺 Please screen
          </button>
        </div>
      )}

      {/* ── ASK state ── */}
      {state === 'ask' && (
        <div className="gp-card">
          <img
            src={GOMA_CAT_GIF}
            alt="Goma cat"
            className="gp-gif gp-gif--square"
            draggable={false}
          />
          <EditableText
            as="h1" className="gp-title"
            value={askTitle}
            isEditing={isEditing}
            onChange={val => save('askTitle', val)}
            style={pc.style_askTitle || {}}
            onStyleSave={st => save('style_askTitle', st)}
          />
          <EditableText
            as="p" className="gp-subtitle"
            value={askSub}
            isEditing={isEditing}
            onChange={val => save('askSub', val)}
            style={pc.style_askSub || {}}
            onStyleSave={st => save('style_askSub', st)}
          />
          {!isEditing && (
            <div className="gp-actions">
              <button className="gp-btn gp-btn--no" onClick={() => setState('please')} aria-label="No">✕</button>
              <button className="gp-btn gp-btn--yes" onClick={onAccept} aria-label="Yes">✓</button>
            </div>
          )}
          {isEditing && (
            <div className="gp-actions gp-actions--preview">
              <button className="gp-btn gp-btn--no" disabled aria-label="No preview">✕</button>
              <button className="gp-btn gp-btn--yes" disabled aria-label="Yes preview">✓</button>
            </div>
          )}
        </div>
      )}

      {/* ── PLEASE state ── */}
      {state === 'please' && (
        <div className="gp-card">
          <img
            src={MOCHI_COUPLE_GIF}
            alt="Mochi couple hugging"
            className="gp-gif gp-gif--wide"
            draggable={false}
          />
          <EditableText
            as="h1" className="gp-title"
            value={pleaseTitle}
            isEditing={isEditing}
            onChange={val => save('pleaseTitle', val)}
            style={pc.style_pleaseTitle || {}}
            onStyleSave={st => save('style_pleaseTitle', st)}
          />
          <EditableText
            as="p" className="gp-subtitle"
            value={pleaseSub}
            isEditing={isEditing}
            onChange={val => save('pleaseSub', val)}
            style={pc.style_pleaseSub || {}}
            onStyleSave={st => save('style_pleaseSub', st)}
          />
          {!isEditing && (
            <button className="gp-btn gp-btn--back" onClick={() => setState('ask')} aria-label="Go back">←</button>
          )}
        </div>
      )}

    </div>
  );
}
