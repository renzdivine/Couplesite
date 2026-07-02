// ─────────────────────────────────────────────────────────────
// AdminLogin.jsx  — Client (Admin) login
// Route: /admin/login
// Clients log in with Gmail + password to access their
// own couple page dashboard.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Heart, Eye, EyeOff, Mail } from 'lucide-react';
import '../styles/pages/AdminLogin.css';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { clientLogin, clientSession } = useApp();

  const [gmail,   setGmail]   = useState('');
  const [pw,      setPw]      = useState('');
  const [showPw,  setShowPw]  = useState(false);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clientSession) navigate('/admin', { replace: true });
  }, [clientSession, navigate]);

  if (clientSession) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await clientLogin(gmail.trim().toLowerCase(), pw);
    if (result.success) {
      navigate('/admin');
    } else {
      setError(result.error || 'Invalid credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="al-root">
      <div className="al-container">
        <div className="al-card">
          {/* Header */}
          <div className="al-header">
            <div className="al-header-icon">
              <Heart size={28} color="#ff9ab5" />
            </div>
            <h1 className="al-title">Client Login</h1>
            <p className="al-subtitle">HeartLink — Access Your Love Page</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Gmail */}
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,180,200,0.4)', zIndex: 1 }} />
              <input
                type="email"
                placeholder="yourname@gmail.com"
                value={gmail}
                onChange={e => { setGmail(e.target.value); setError(''); }}
                required
                className="al-input"
                style={{ paddingLeft: 40 }}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                value={pw}
                onChange={e => { setPw(e.target.value); setError(''); }}
                required
                className="al-input"
                style={{ paddingRight: 44 }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', top: '50%', right: 14, transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,180,200,0.5)', cursor: 'pointer', padding: 4 }}
                aria-label="Toggle password"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {error && <p className="al-error">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className={`al-submit-btn ${loading ? 'al-submit-btn--loading' : 'al-submit-btn--active'}`}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="al-demo-hint">
            Demo: <code className="al-demo-code">renzjane@gmail.com</code> / <code className="al-demo-code">renzjane2024</code>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,150,180,0.1)', marginTop: 20, paddingTop: 16, textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,180,200,0.4)', fontSize: '0.82rem', margin: '0 0 10px' }}>
              New client?{' '}
              <button onClick={() => navigate('/register')} style={{ background: 'none', border: 'none', color: '#ff9ab5', cursor: 'pointer', fontSize: '0.82rem', padding: 0, textDecoration: 'underline' }}>
                Register with activation code →
              </button>
            </p>
            <p style={{ color: 'rgba(255,180,200,0.25)', fontSize: '0.75rem', margin: 0 }}>
              Website owner?{' '}
              <button onClick={() => navigate('/master')} style={{ background: 'none', border: 'none', color: 'rgba(255,180,200,0.4)', cursor: 'pointer', fontSize: '0.75rem', padding: 0, textDecoration: 'underline' }}>
                Master Admin →
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
