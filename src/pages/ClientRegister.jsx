import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Heart, Eye, EyeOff, Mail, Key, User } from 'lucide-react';

export default function ClientRegister() {
  const navigate = useNavigate();
  const { clientRegister, clientSession } = useApp();

  const [step,    setStep]    = useState('form');
  const [gmail,   setGmail]   = useState('');
  const [pw,      setPw]      = useState('');
  const [pw2,     setPw2]     = useState('');
  const [code,    setCode]    = useState('');
  const [showPw,  setShowPw]  = useState(false);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clientSession) navigate('/admin', { replace: true });
  }, [clientSession, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!gmail.includes('@')) { setError('Enter a valid Gmail address.'); return; }
    if (pw.length < 6)        { setError('Password must be at least 6 characters.'); return; }
    if (pw !== pw2)           { setError('Passwords do not match.'); return; }
    if (!code.trim())         { setError('Activation code is required.'); return; }

    setLoading(true);
    const result = await clientRegister(gmail.trim().toLowerCase(), pw, code.trim().toUpperCase());
    if (result.success) {
      setStep('success');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  if (step === 'success') {
    return (
      <div style={styles.root}>
        <div style={styles.bg} /><div style={styles.overlay} />
        <div style={styles.card}>
          <div style={{ ...styles.iconWrap, background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.25)' }}>
            <Heart size={32} color="#4caf50" fill="#4caf50" />
          </div>
          <h1 style={styles.title}>You're In! 💕</h1>
          <p style={styles.subtitle}>Account registered successfully.</p>
          <p style={{ color: 'rgba(100,50,80,0.6)', fontSize: '0.9rem', textAlign: 'center', marginBottom: 28, lineHeight: 1.7 }}>
            Your love page is ready. Log in with your Gmail and password to start customizing.
          </p>
          <button onClick={() => navigate('/admin/login')} style={styles.btn}>
            Go to Client Login →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <div style={styles.bg} /><div style={styles.overlay} />

      <div style={styles.card}>
        <div style={styles.iconWrap}>
          <Heart size={30} color="#ff9ab5" />
        </div>
        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.subtitle}>HeartLink Client Registration</p>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <label style={styles.lbl}>Gmail Address</label>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,180,200,0.4)' }} />
            <input
              style={{ ...styles.inp, paddingLeft: 40, marginBottom: 0 }}
              type="email"
              placeholder="yourname@gmail.com"
              value={gmail}
              onChange={e => { setGmail(e.target.value); setError(''); }}
              required
              autoComplete="email"
            />
          </div>

          <label style={styles.lbl}>Password</label>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <input
              style={{ ...styles.inp, paddingRight: 44, marginBottom: 0 }}
              type={showPw ? 'text' : 'password'}
              placeholder="At least 6 characters"
              value={pw}
              onChange={e => { setPw(e.target.value); setError(''); }}
              required
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowPw(v => !v)} style={styles.eyeBtn} aria-label="Toggle password">
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <label style={styles.lbl}>Confirm Password</label>
          <input
            style={styles.inp}
            type="password"
            placeholder="Re-enter password"
            value={pw2}
            onChange={e => { setPw2(e.target.value); setError(''); }}
            required
            autoComplete="new-password"
          />

          <label style={styles.lbl}>Activation Code</label>
          <div style={{ position: 'relative', marginBottom: 4 }}>
            <Key size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,180,200,0.4)' }} />
            <input
              style={{ ...styles.inp, paddingLeft: 40, marginBottom: 0, textTransform: 'uppercase', letterSpacing: 1 }}
              type="text"
              placeholder="HL-2024-XXXX-XXXX"
              value={code}
              onChange={e => { setCode(e.target.value); setError(''); }}
              required
            />
          </div>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,180,200,0.35)', marginBottom: 16 }}>
            Provided by your HeartLink administrator.
          </p>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Registering...' : 'Create My Account'}
          </button>
        </form>

        <div style={styles.divider} />
        <p style={styles.hint}>
          Already registered?{' '}
          <button onClick={() => navigate('/admin/login')} style={styles.link}>Sign In →</button>
        </p>
      </div>
    </div>
  );
}

const styles = {
  root: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', fontFamily: 'system-ui, sans-serif' },
  bg:   { position: 'fixed', inset: 0, background: 'linear-gradient(135deg, #fef5f9 0%, #fff0f5 50%, #fef5f9 100%)', zIndex: 0 },
  overlay: { position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, rgba(255,182,193,0.15) 0%, transparent 65%)', zIndex: 0 },
  card: { position: 'relative', zIndex: 1, background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(233,30,140,0.15)', borderRadius: 24, padding: '44px 36px', width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', backdropFilter: 'blur(24px)', boxShadow: '0 8px 32px rgba(233,30,140,0.12)' },
  iconWrap: { width: 64, height: 64, borderRadius: 20, background: 'rgba(233,30,140,0.08)', border: '1px solid rgba(233,30,140,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title:   { margin: '0 0 6px', fontSize: '1.7rem', fontWeight: 700, background: 'linear-gradient(135deg, #e91e8c, #9c27b0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  subtitle:{ margin: '0 0 28px', color: 'rgba(100,50,80,0.6)', fontSize: '0.9rem' },
  lbl:  { display: 'block', marginBottom: 5, fontSize: '0.75rem', color: 'rgba(100,50,80,0.7)', textTransform: 'uppercase', letterSpacing: 0.8, alignSelf: 'flex-start' },
  inp:  { width: '100%', padding: '12px 14px', background: 'rgba(233,30,140,0.03)', border: '1px solid rgba(233,30,140,0.2)', borderRadius: 12, color: '#2d1b2e', fontSize: '0.95rem', outline: 'none', marginBottom: 14, boxSizing: 'border-box' },
  eyeBtn: { position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(100,50,80,0.5)', cursor: 'pointer', padding: 4 },
  error:  { color: '#e91e8c', fontSize: '0.85rem', marginBottom: 12, textAlign: 'center' },
  btn:    { width: '100%', padding: '13px', background: 'linear-gradient(135deg, #e91e8c, #9c27b0)', border: 'none', borderRadius: 50, color: '#fff', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 6px 20px rgba(233,30,140,0.3)', transition: 'opacity 0.2s' },
  divider:{ width: '100%', height: 1, background: 'rgba(233,30,140,0.15)', margin: '24px 0 16px' },
  hint:   { color: 'rgba(100,50,80,0.6)', fontSize: '0.85rem', margin: 0 },
  link:   { background: 'none', border: 'none', color: '#e91e8c', cursor: 'pointer', fontSize: '0.85rem', padding: 0, textDecoration: 'underline' },
};
