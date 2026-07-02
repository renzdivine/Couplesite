// ─────────────────────────────────────────────────────────────
// MasterLogin.jsx  — Website owner (Master Admin) login
// Route: /master
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Shield, Eye, EyeOff } from 'lucide-react';

export default function MasterLogin() {
  const navigate = useNavigate();
  const { masterLogin, masterLoggedIn } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (masterLoggedIn) navigate('/master/dashboard', { replace: true });
  }, [masterLoggedIn, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const ok = await masterLogin(username, password);
    if (ok) navigate('/master/dashboard');
    else { setError('Invalid credentials. Access denied.'); setLoading(false); }
  };

  return (
    <div style={styles.root}>
      {/* Background */}
      <div style={styles.bg} />
      <div style={styles.overlay} />

      <div style={styles.card}>
        {/* Icon */}
        <div style={styles.iconWrap}>
          <Shield size={32} color="#ff9ab5" />
        </div>

        <h1 style={styles.title}>Master Admin</h1>
        <p style={styles.subtitle}>HeartLink System Control</p>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <label style={styles.lbl}>Username</label>
          <input
            style={styles.inp}
            type="text"
            placeholder="masteradmin"
            value={username}
            onChange={e => { setUsername(e.target.value); setError(''); }}
            required
            autoComplete="username"
          />

          <label style={styles.lbl}>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              style={{ ...styles.inp, paddingRight: 44 }}
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              style={styles.eyeBtn}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Authenticating...' : 'Access Dashboard'}
          </button>
        </form>

        <div style={styles.divider} />

        <p style={styles.hint}>
          Client? <button onClick={() => navigate('/admin/login')} style={styles.link}>Client Login →</button>
        </p>
      </div>
    </div>
  );
}

const styles = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    position: 'relative',
    fontFamily: 'system-ui, sans-serif',
  },
  bg: {
    position: 'fixed', inset: 0,
    background: 'linear-gradient(135deg, #050010 0%, #0d0020 50%, #050010 100%)',
    zIndex: 0,
  },
  overlay: {
    position: 'fixed', inset: 0,
    background: 'radial-gradient(ellipse at 60% 40%, rgba(100,0,80,0.25) 0%, transparent 65%), radial-gradient(ellipse at 30% 70%, rgba(50,0,100,0.2) 0%, transparent 60%)',
    zIndex: 0,
  },
  card: {
    position: 'relative', zIndex: 1,
    background: 'rgba(10,0,20,0.85)',
    border: '1px solid rgba(255,150,180,0.2)',
    borderRadius: 24,
    padding: '44px 36px',
    width: '100%',
    maxWidth: 420,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backdropFilter: 'blur(24px)',
    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
  },
  iconWrap: {
    width: 64, height: 64,
    borderRadius: 20,
    background: 'rgba(233,30,140,0.15)',
    border: '1px solid rgba(233,30,140,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    margin: '0 0 6px',
    fontSize: '1.7rem',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #ff9ab5, #d4a0ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    margin: '0 0 32px',
    color: 'rgba(255,180,200,0.5)',
    fontSize: '0.9rem',
  },
  lbl: {
    display: 'block',
    marginBottom: 6,
    fontSize: '0.75rem',
    color: 'rgba(255,180,200,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inp: {
    width: '100%',
    padding: '12px 14px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,150,180,0.25)',
    borderRadius: 12,
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
    marginBottom: 18,
    boxSizing: 'border-box',
  },
  eyeBtn: {
    position: 'absolute', top: '50%', right: 12,
    transform: 'translateY(-60%)',
    background: 'none', border: 'none',
    color: 'rgba(255,180,200,0.5)',
    cursor: 'pointer', padding: 4,
  },
  error: {
    color: '#ff6b6b',
    fontSize: '0.85rem',
    marginBottom: 12,
    textAlign: 'center',
  },
  btn: {
    width: '100%',
    padding: '13px',
    background: 'linear-gradient(135deg, #7b1fa2, #4a0080)',
    border: 'none',
    borderRadius: 50,
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(123,31,162,0.4)',
    marginTop: 4,
    transition: 'opacity 0.2s',
  },
  divider: {
    width: '100%',
    height: 1,
    background: 'rgba(255,150,180,0.1)',
    margin: '24px 0 16px',
  },
  hint: {
    color: 'rgba(255,180,200,0.45)',
    fontSize: '0.85rem',
    margin: 0,
  },
  link: {
    background: 'none', border: 'none',
    color: '#ff9ab5', cursor: 'pointer',
    fontSize: '0.85rem', padding: 0,
    textDecoration: 'underline',
  },
};
