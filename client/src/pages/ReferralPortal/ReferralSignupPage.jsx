import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, Check, Copy, CheckCheck } from 'lucide-react';

export function ReferralSignupPage({ onSignupSuccess, onGoToLogin, onGoToHome }) {
  const { setSession } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [copied, setCopied] = useState(false);

  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [isCaptchaVerifying, setIsCaptchaVerifying] = useState(false);

  const handleCaptchaClick = () => {
    if (isCaptchaVerified || isCaptchaVerifying) return;
    setIsCaptchaVerifying(true);
    setTimeout(() => {
      setIsCaptchaVerified(true);
      setIsCaptchaVerifying(false);
    }, 1000);
  };

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const copyCode = () => {
    if (success?.referralCode) {
      navigator.clipboard.writeText(success.referralCode).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isCaptchaVerified) {
      setError('Please verify that you are not a robot.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/referral-partners/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password
        })
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Registration failed.');
      }
      setSession(data.token, data.user);
      setSuccess({ referralCode: data.partner?.referralCode || '' });
    } catch (err) {
      setError(err.message || 'Registration failed.');
      setIsCaptchaVerified(false);
      setIsCaptchaVerifying(false);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
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
            <p>Welcome aboard! Start sharing your referral code and earn commissions.</p>
          </div>
          <div className="lb-foot">&copy; 2026 IED India Pvt Ltd. All rights reserved.</div>
        </div>
        <div className="login-container">
          <div className="login-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              <Check size={48} color="#16a34a" />
            </div>
            <h2 style={{ color: '#16a34a', marginBottom: '8px' }}>Registration Successful!</h2>
            <p className="login-subtitle" style={{ marginBottom: '24px' }}>
              Your referral partner account has been created. Here is your unique referral code:
            </p>
            <div style={{
              background: '#f0f9ff', border: '2px dashed #03377A', borderRadius: '12px',
              padding: '20px', margin: '0 auto 24px', maxWidth: '300px'
            }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#03377A', letterSpacing: '3px' }}>
                {success.referralCode}
              </div>
              <button
                onClick={copyCode}
                style={{
                  marginTop: '10px', background: 'none', border: '1px solid #03377A',
                  borderRadius: '6px', padding: '6px 14px', cursor: 'pointer',
                  color: '#03377A', fontSize: '13px', display: 'inline-flex',
                  alignItems: 'center', gap: '6px'
                }}
              >
                {copied ? <><CheckCheck size={14} /> Copied!</> : <><Copy size={14} /> Copy Code</>}
              </button>
            </div>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
              Share this code with students applying for internships at IED India.
              You'll earn a commission on each successful paid application.
            </p>
            <button className="btn btn-primary btn-full" onClick={onSignupSuccess}>
              Go to Dashboard <ArrowRight size={16} style={{ marginLeft: '6px' }} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="login-page" className="login-page">
      <div className="login-brand">
        <div className="lb-orbs"></div>
        <div className="lb-logo" onClick={onGoToHome} style={{ cursor: 'pointer' }}>
          <img className="lb-mark brand-img" src="/img/whitelogo.png" alt="IED India" />
          <div className="lb-name">IED Interns</div>
        </div>
        <div className="lb-body">
          <h2>Become a Referral Partner</h2>
          <p>
            Register to get your unique referral code. When students use your code during their
            internship application, you earn a commission on every successful payment.
          </p>
          <p style={{ marginTop: '12px' }}>
            Track all your referrals, commissions, and payouts from a dedicated partner dashboard.
          </p>
        </div>
        <div className="lb-foot">&copy; 2026 IED India Pvt Ltd. All rights reserved.</div>
      </div>

      <div className="login-container">
        <div className="login-card">
          <div className="login-back" onClick={onGoToHome}>
            <ChevronLeft size={16} /> Back to home
          </div>
          <h2>Partner Registration</h2>
          <p className="login-subtitle">Create your Referral Partner account.</p>
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name *</label>
              <div className="input-wrap">
                <User size={16} className="input-icon" />
                <input
                  type="text" placeholder="Your full name" required
                  value={form.name} onChange={(e) => updateField('name', e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Email Address *</label>
              <div className="input-wrap">
                <Mail size={16} className="input-icon" />
                <input
                  type="email" placeholder="you@email.com" required
                  value={form.email} onChange={(e) => updateField('email', e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <div className="input-wrap">
                <Phone size={16} className="input-icon" />
                <input
                  type="tel" placeholder="10-digit number"
                  value={form.phone} onChange={(e) => updateField('phone', e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Password *</label>
              <div className="input-wrap">
                <Lock size={16} className="input-icon" />
                <input
                  type={showPass ? 'text' : 'password'} placeholder="Min 6 characters"
                  required minLength={6}
                  value={form.password} onChange={(e) => updateField('password', e.target.value)}
                />
                <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Confirm Password *</label>
              <div className="input-wrap">
                <Lock size={16} className="input-icon" />
                <input
                  type={showPass ? 'text' : 'password'} placeholder="Re-enter password"
                  required minLength={6}
                  value={form.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)}
                />
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
                  <span>Create Partner Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
          <p className="login-switch">
            Already have a partner account?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); onGoToLogin(); }}>
              Sign in
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

export default ReferralSignupPage;
