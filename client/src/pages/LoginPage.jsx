import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Mail, Lock, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';

export function LoginPage({ onLoginSuccess, onGoToSignup, onGoToApply, onGoToHome }) {
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Captcha State
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
      await login(email, password);
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
      {/* brand panel */}
      <div className="login-brand">
        <div className="lb-orbs"></div>
        <div className="lb-logo" id="login-home-logo" onClick={onGoToHome} style={{ cursor: 'pointer' }}>
          <img className="lb-mark brand-img" src="/img/whitelogo.png" alt="IED India" />
          <div className="lb-name">IED Interns</div>
        </div>
        <div className="lb-body">
          <h2>One workspace for the whole internship journey.</h2>
          <p>
            Admins manage interns, attendance, tasks, and certificates. Interns track their work,
            leave, and progress — all in one place.
          </p>
          <div className="lb-stats">
            <div className="lb-stat">
              <b>
                500<span className="lb-stat-plus">+</span>
              </b>
              <span>Interns Trained</span>
            </div>
            <div className="lb-stat">
              <b>
                98<span className="lb-stat-pct">%</span>
              </b>
              <span>Success Rate</span>
            </div>
            <div className="lb-stat">
              <b>6</b>
              <span>Departments</span>
            </div>
          </div>
        </div>
        <div className="lb-foot">© 2026 IED India Pvt Ltd. All rights reserved.</div>
      </div>

      {/* form panel */}
      <div className="login-container">
        <div className="login-card">
          <div className="login-back" id="login-back-home" onClick={onGoToHome}>
            <ChevronLeft size={16} /> Back to home
          </div>
          <h2>Welcome back</h2>
          <p className="login-subtitle">Sign in to your IED Interns workspace.</p>
          <form id="login-form" className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="login-email">Email Address</label>
              <div className="input-wrap">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  id="login-email"
                  placeholder="you@ied.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <div className="input-wrap">
                <Lock size={16} className="input-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  id="login-password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  id="toggle-pass"
                  className="pass-toggle"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Captcha Box */}
            <div id="captcha-container" className="captcha-box">
              <div className="captcha-left" id="captcha-trigger" onClick={handleCaptchaClick}>
                <div
                  id="captcha-checkbox"
                  className="captcha-check"
                  style={{
                    backgroundColor: isCaptchaVerified ? '#00e676' : 'white',
                    borderColor: isCaptchaVerified ? '#00e676' : '#c2bcae',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {isCaptchaVerifying && (
                    <div
                      className="spinner"
                      style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid var(--accent-blue)',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                      }}
                    ></div>
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

            {error && (
              <div id="login-error" className="error-msg">
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full" id="login-btn" disabled={loading}>
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
            Don't have an account?{' '}
            <a href="#" id="show-signup" onClick={(e) => { e.preventDefault(); onGoToSignup(); }}>
              Sign up for free
            </a>
          </p>
          <p className="apply-link">
            <a href="#" id="show-apply" onClick={(e) => { e.preventDefault(); onGoToApply(); }}>
              Apply for Internship
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
