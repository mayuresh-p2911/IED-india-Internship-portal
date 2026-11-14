import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, Mail, Lock, Eye, EyeOff, ArrowRight, Check, Users } from 'lucide-react';

export function ReferralLoginPage({ onLoginSuccess, onGoToSignup, onGoToHome }) {
  const { setSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [isCaptchaVerifying, setIsCaptchaVerifying] = useState(false);

  const resetCaptcha = () => {
    setIsCaptchaVerified(false);
    setIsCaptchaVerifying(false);
  };

  const handleCaptchaClick = () => {
    if (isCaptchaVerified || isCaptchaVerifying) return;
    setIsCaptchaVerifying(true);
    setTimeout(() => {
      setIsCaptchaVerified(true);
      setIsCaptchaVerifying(false);
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isCaptchaVerified) {
      setError('Please verify that you are not a robot.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/referral-partners/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Login failed.');
      }
      setSession(data.token, data.user);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-page" className="login-page">
      <div className="login-brand">
        <div className="lb-orbs"></div>
        <div className="lb-logo" onClick={onGoToHome} style={{ cursor: 'pointer' }}>
          <img className="lb-mark brand-img" src="/img/whitelogo.png" alt="IED India" />
          <div className="lb-name">IED Interns</div>
        </div>
        <div className="lb-body">
          <h2>Referral Partner Program</h2>
          <p>
            <strong>Earn with IED India:</strong> Join our referral partner program and earn commissions
            for every student you refer to our internship program. Share your unique referral code,
            track your referrals, and request payouts — all from your partner dashboard.
          </p>
          <p style={{ marginTop: '12px' }}>
            Help students kickstart their careers while building your own income stream through our
            transparent commission system.
          </p>
          <div className="lb-stats">
            <div className="lb-stat">
              <b>10<span className="lb-stat-pct">%</span></b>
              <span>Commission Rate</span>
            </div>
            <div className="lb-stat">
              <b><Users size={20} /></b>
              <span>Unlimited Referrals</span>
            </div>
            <div className="lb-stat">
              <b>Weekly</b>
              <span>Payouts</span>
            </div>
          </div>
        </div>
        <div className="lb-foot">&copy; 2026 IED India Pvt Ltd. All rights reserved.</div>
      </div>

      <div className="login-container">
        <div className="login-card">
          <div className="login-back" onClick={onGoToHome}>
            <ChevronLeft size={16} /> Back to home
          </div>
          <h2>Partner Login</h2>
          <p className="login-subtitle">Sign in to your Referral Partner dashboard.</p>
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrap">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  placeholder="you@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="input-wrap">
                <Lock size={16} className="input-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="captcha-box">
              <div className="captcha-left" onClick={handleCaptchaClick}>
                <div
                  className="captcha-check"
                  style={{
                    backgroundColor: isCaptchaVerified ? '#00e676' : 'white',
                    borderColor: isCaptchaVerified ? '#00e676' : '#c2bcae',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  {isCaptchaVerifying && (
                    <div className="spinner" style={{ width: '14px', height: '14px', border: '2px solid var(--accent-blue)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                  )}
                  {isCaptchaVerified && <Check size={14} color="white" />}
                </div>
                <span>I am not a robot</span>
              </div>
              <div className="captcha-right">
                <img src="/img/bluelogo.png" alt="Security" />
                <span>Security Check</span>
              </div>
            </div>

            {error && <div className="error-msg">{error}</div>}

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? (
                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
          <p className="login-switch">
            Don't have a partner account?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); onGoToSignup(); }}>
              Register as Partner
            </a>
          </p>
          <p className="apply-link">
            <a href="#" onClick={(e) => { e.preventDefault(); onGoToHome(); }}>
              Back to Main Portal
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ReferralLoginPage;
