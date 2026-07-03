import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { EditableText } from '../components/EditableField';
import '../styles/pages/CodeScreen.css';

const PAD_KEYS = ['1','2','3','4','5','6','7','8','9','.','0','DEL'];

export default function CodeScreen({
  couple,
  slug,
  onSuccess,
  isEditing      = false,
  onContentChange,  
  onCodeChange,     
}) {
  const { coupleLogin } = useApp();

  const pc        = couple?.pageContent?.codeScreen || {};
  const topLabel  = pc.topLabel  ?? 'Happy Monthsary, My Love!';
  const subLabel  = pc.subLabel  ?? 'Enter our monthsary date';
  const title     = pc.title     ?? 'Enter Code';
  const hint      = pc.hint      ?? 'The day you finally said "YES" to me.';
  const footer    = pc.footer    ?? 'Enter the 4-digit code from your invitation';
  const savePC = (field, val) => onContentChange?.({ ...pc, [field]: val });
  const saveTopLabel = (val) => onContentChange?.({ ...pc, topLabel: val });
  const saveSubLabel = (val) => onContentChange?.({ ...pc, subLabel: val });

  
  const [digits,   setDigits]   = useState([]);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [shake,    setShake]    = useState(false);

  
  const [settingCode, setSettingCode] = useState(false);
  const [newDigits,   setNewDigits]   = useState([]);
  const [codeSaved,   setCodeSaved]   = useState(false);

  
  useEffect(() => {
    if (!isEditing && digits.length === 4 && !loading && !unlocked) {
      submitCode(digits.join(''));
    }
  
  }, [digits]);

  const handleKey = (key) => {
    if (isEditing || loading || unlocked) return;
    if (key === 'DEL') { setDigits(p => p.slice(0, -1)); setError(''); return; }
    if (key === '.')   return;
    if (digits.length < 4) { setDigits(p => [...p, key]); setError(''); }
  };

  const submitCode = async (code) => {
    setLoading(true); setError('');
    const result = await coupleLogin(slug || couple?.slug || 'renz-jane', code);
    if (result.success) {
      setUnlocked(true); setTimeout(() => onSuccess?.(), 1200);
    } else {
      setShake(true);
      setError(result.error || 'Wrong code. Try again.');
      setDigits([]);
      setTimeout(() => setShake(false), 600);
    }
    setLoading(false);
  };

  
  const handleNewKey = (key) => {
    if (key === 'DEL') { setNewDigits(p => p.slice(0, -1)); setCodeSaved(false); return; }
    if (key === '.')   return;
    if (newDigits.length < 4) {
      const next = [...newDigits, key];
      setNewDigits(next);
      setCodeSaved(false);
      if (next.length === 4) {
        
        onCodeChange?.(next.join(''));
        setCodeSaved(true);
        setTimeout(() => {
          setSettingCode(false);
          setNewDigits([]);
          setCodeSaved(false);
        }, 1200);
      }
    }
  };

  
  const padHandler = isEditing && settingCode ? handleNewKey : handleKey;

  return (
    <div className="cs-outer">
      {}
      <div className="cs-top-label">
        <EditableText
          as="h1" className="cs-top-title"
          value={topLabel}
          isEditing={isEditing}
          onChange={saveTopLabel}
        />
        <EditableText
          as="p" className="cs-top-subtitle"
          value={subLabel}
          isEditing={isEditing}
          onChange={saveSubLabel}
        />
      </div>

    <div className="cs-wrapper" data-editing={isEditing || undefined}>

      {}
      <div className={`cs-slots${shake ? ' cs-shake' : ''}`}>
        {[0,1,2,3].map(i => {
          const activeDigits = settingCode ? newDigits : digits;
          const filled = activeDigits[i] !== undefined;
          return (
            <div key={i} className={`cs-slot${filled ? ' cs-slot--filled' : ''}`}>
              {filled
                ? (settingCode ? '●' : activeDigits[i])
                : <span className="cs-heart">♥</span>}
            </div>
          );
        })}
      </div>

      {}
      {settingCode ? (
        <p className="cs-hint" style={{ color: codeSaved ? '#81c784' : undefined }}>
          {codeSaved
            ? '✓ Code saved!'
            : newDigits.length === 0
            ? 'Press 4 digits on the pad below'
            : `${newDigits.length} / 4 entered`}
        </p>
      ) : (error || loading || unlocked) ? (
        <p className="cs-hint">
          {unlocked ? 'Unlocked!' : error || 'Opening your page...'}
        </p>
      ) : null}

      {}
      <div className="cs-pad">
        {PAD_KEYS.map(key => (
          <button
            key={key}
            className={`cs-key${key === '.' ? ' cs-key--dot' : ''}${key === 'DEL' ? ' cs-key--del' : ''}`}
            onClick={() => padHandler(key)}
            disabled={!isEditing && (loading || unlocked)}
            aria-label={key === 'DEL' ? 'Delete' : key}
          >
            {key}
          </button>
        ))}
      </div>


      {}
      {isEditing && (
        <div className="cs-admin-bar">
          {!settingCode ? (
            <>
              <span className="cs-admin-current">
                Current code:&nbsp;
                <strong>{couple?.accessCode ? '••••' : 'not set'}</strong>
              </span>
              <button
                className="cs-admin-set-btn"
                onClick={() => { setSettingCode(true); setNewDigits([]); setCodeSaved(false); }}
              >
                Set New Code
              </button>
            </>
          ) : (
            <button
              className="cs-admin-cancel-btn"
              onClick={() => { setSettingCode(false); setNewDigits([]); }}
            >
              ✕ Cancel
            </button>
          )}
        </div>
      )}
    </div>
    </div>
  );
}
