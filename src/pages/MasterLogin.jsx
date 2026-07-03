import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Shield, Eye, EyeOff, Heart } from 'lucide-react';

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
      <div style={styles.card}>
        <div style={styles.iconWrap}>
          <Heart size={26} color="#fff" fill="#fff" />
        </div>

        <h1 style={styles.title}>HeartLink</h1>
        <p style={styles.subtitle}>Master Admin Panel</p>

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
              style={{ ...styles.inp, paddingRight: 44, marginBottom: 0 }}
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
            style={{ ...styles.btn, opacity: loading ? 0.7 : 1, marginTop: error ? 0 : 20 }}
          >
            {loading ? 'Authenticating…' : 'Access Dashboard'}
          </button>
        </form>

        <div style={styles.divider} />

        <p style={styles.hint}>
          Client?{' '}
          <button onClick={() => navigate('/admin/login')} style={styles.link}>
            Client Login →
          </button>
        </p>
      </div>
    </div>
  );
}

const ACC = '#e91e8c';

const styles = {
  root: {
    minHeight: '100vh',
    background: '#f8f9fb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    fontFamily: 'system-ui, sans-serif',
  },
  card: {
    background: '#fff',
    border: '1px solid #e8eaed',
    borderRadius: 24,
    padding: '44px 40px',
    width: '100%',
    maxWidth: 400,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  iconWrap: {
    width: 56, height: 56,
    borderRadius: 16,
    background: ACC,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
    boxShadow: `0 6px 18px ${ACC}40`,
  },
  title: {
    margin: '0 0 4px',
    fontSize: '1.6rem',
    fontWeight: 800,
    color: '#1a1a2e',
    letterSpacing: -0.4,
  },
  subtitle: {
    margin: '0 0 32px',
    color: '#9ca3af',
    fontSize: '0.85rem',
    fontWeight: 500,
  },
  lbl: {
    display: 'block',
    marginBottom: 6,
    fontSize: '0.72rem',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: 600,
    width: '100%',
  },
  inp: {
    width: '100%',
    padding: '11px 14px',
    background: '#fff',
    border: '1px solid #e8eaed',
    borderRadius: 10,
    color: '#1a1a2e',
    fontSize: '0.95rem',
    outline: 'none',
    marginBottom: 16,
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  eyeBtn: {
    position: 'absolute', top: '50%', right: 12,
    transform: 'translateY(-50%)',
    background: 'none', border: 'none',
    color: '#9ca3af',
    cursor: 'pointer', padding: 4,
  },
  error: {
    color: '#dc2626',
    fontSize: '0.83rem',
    marginTop: 12,
    marginBottom: 0,
    textAlign: 'center',
    width: '100%',
  },
  btn: {
    width: '100%',
    padding: '12px',
    background: ACC,
    border: 'none',
    borderRadius: 50,
    color: '#fff',
    fontSize: '0.96rem',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: `0 4px 14px ${ACC}40`,
    transition: 'opacity 0.2s',
    letterSpacing: 0.2,
  },
  divider: {
    width: '100%',
    height: 1,
    background: '#f3f4f6',
    margin: '24px 0 16px',
  },
  hint: {
    color: '#9ca3af',
    fontSize: '0.85rem',
    margin: 0,
  },
  link: {
    background: 'none', border: 'none',
    color: ACC, cursor: 'pointer',
    fontSize: '0.85rem', padding: 0,
    fontWeight: 600,
  },
};
