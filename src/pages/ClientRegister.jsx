import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Heart, Eye, EyeOff, Mail, Key } from 'lucide-react';
import '../styles/pages/ClientRegister.css';

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
      <div className="cr-root">
        <div className="cr-container">
          <div className="cr-card">
            <div className="cr-header">
              <div className="cr-header-icon cr-header-icon--success">
                <Heart size={26} color="#4caf50" fill="#4caf50" />
              </div>
              <h1 className="cr-title">You're In! 💕</h1>
              <p className="cr-subtitle">Account registered successfully</p>
            </div>
            <p className="cr-success-message">
              Your love page is ready. Log in with your Gmail and password to start customizing.
            </p>
            <button 
              onClick={() => navigate('/admin/login')} 
              className="cr-submit-btn cr-submit-btn--active"
            >
              Go to Client Login →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cr-root">
      <div className="cr-container">
        <div className="cr-card">

          <div className="cr-header">
            <div className="cr-header-icon">
              <Heart size={26} color="hsl(330, 70%, 52%)" />
            </div>
            <h1 className="cr-title">Create Account</h1>
            <p className="cr-subtitle">LoveGift Client Registration</p>
          </div>

          <form onSubmit={handleSubmit} className="cr-form">

            <label className="cr-label">Gmail Address</label>
            <div className="cr-input-wrapper">
              <Mail size={15} className="cr-icon-left" aria-hidden="true" />
              <input
                type="email"
                placeholder="yourname@gmail.com"
                value={gmail}
                onChange={e => { setGmail(e.target.value); setError(''); }}
                required
                className="cr-input cr-input--with-icon-left"
                autoComplete="email"
              />
            </div>

            <label className="cr-label">Password</label>
            <div className="cr-input-wrapper">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={pw}
                onChange={e => { setPw(e.target.value); setError(''); }}
                required
                className="cr-input cr-input--with-icon-right"
                autoComplete="new-password"
              />
              <button 
                type="button" 
                onClick={() => setShowPw(v => !v)} 
                className="cr-icon-pw-toggle" 
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <label className="cr-label">Confirm Password</label>
            <div className="cr-input-wrapper">
              <input
                type="password"
                placeholder="Re-enter password"
                value={pw2}
                onChange={e => { setPw2(e.target.value); setError(''); }}
                required
                className="cr-input"
                autoComplete="new-password"
              />
            </div>

            <label className="cr-label">Activation Code</label>
            <div className="cr-input-wrapper">
              <Key size={15} className="cr-icon-left" aria-hidden="true" />
              <input
                type="text"
                placeholder="HL-2024-XXXX-XXXX"
                value={code}
                onChange={e => { setCode(e.target.value); setError(''); }}
                required
                className="cr-input cr-input--with-icon-left cr-input--uppercase"
              />
            </div>
            <p className="cr-hint">
              Provided by your LoveGift administrator.
            </p>

            {error && <p className="cr-error">{error}</p>}

            <button 
              type="submit" 
              disabled={loading} 
              className={`cr-submit-btn ${loading ? 'cr-submit-btn--loading' : 'cr-submit-btn--active'}`}
            >
              {loading ? 'Registering...' : 'Create My Account'}
            </button>

          </form>

          <div className="cr-footer">
            <p className="cr-footer-text">
              Already registered?{' '}
              <button 
                onClick={() => navigate('/admin/login')} 
                className="cr-login-btn"
              >
                Sign In →
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
