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

          <div className="al-header">
            <div className="al-header-icon">
              <Heart size={26} color="hsl(330, 70%, 52%)" />
            </div>
            <h1 className="al-title">Client Login</h1>
            <p className="al-subtitle">HeartLink · Access Your Love Page</p>
          </div>

          <form onSubmit={handleSubmit}>

            <div style={{ position: 'relative' }}>
              <Mail size={15} className="al-icon-mail" aria-hidden="true" />
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
                className="al-icon-pw-toggle"
                aria-label={showPw ? 'Hide password' : 'Show password'}
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

          <div className="al-footer">
            <p className="al-footer-text">
              New client?{' '}
              <button
                onClick={() => navigate('/register')}
                className="al-register-btn"
              >
                Register with activation code →
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
