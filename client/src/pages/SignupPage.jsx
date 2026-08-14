import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, User, Mail, Lock, Phone, Building, ArrowRight } from 'lucide-react';

export function SignupPage({ onSignupSuccess, onGoToLogin, onGoToHome }) {
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        college: college.trim(),
        department
      };
      await register(userData);
      if (onSignupSuccess) onSignupSuccess();
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="signup-page" className="login-page">
      {/* brand panel */}
      <div className="login-brand">
        <div className="lb-orbs"></div>
        <div className="lb-logo" id="signup-home-logo" onClick={onGoToHome} style={{ cursor: 'pointer' }}>
          <img className="lb-mark brand-img" src="/img/whitelogo.png" alt="IED India" />
          <div className="lb-name">IED Interns</div>
        </div>
        <div className="lb-body">
          <h2>Start your internship journey today.</h2>
          <p>
            Create your account and unlock structured internship tracking, mentor collaboration,
            and verifiable certificates — all in one place.
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
          <div className="login-back" id="signup-back-home" onClick={onGoToHome}>
            <ChevronLeft size={16} /> Back to home
          </div>
          <h2>Create account</h2>
          <p className="login-subtitle">Join the IED Interns portal</p>
          <form id="signup-form" className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="signup-name">Full Name *</label>
              <div className="input-wrap">
                <User size={16} className="input-icon" />
                <input
                  type="text"
                  id="signup-name"
                  placeholder="Your full name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="signup-email">Email Address *</label>
              <div className="input-wrap">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  id="signup-email"
                  placeholder="you@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="signup-password">Password *</label>
              <div className="input-wrap">
                <Lock size={16} className="input-icon" />
                <input
                  type="password"
                  id="signup-password"
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="signup-phone">Phone</label>
              <div className="input-wrap">
                <Phone size={16} className="input-icon" />
                <input
                  type="tel"
                  id="signup-phone"
                  placeholder="10-digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="signup-college">College / University</label>
              <div className="input-wrap">
                <Building size={16} className="input-icon" />
                <input
                  type="text"
                  id="signup-college"
                  placeholder="Your college"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="signup-department">Department</label>
              <select
                id="signup-department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="">Select Department</option>
                <option>Digital Marketing</option>
                <option>HR & Recruitment</option>
                <option>Business Development</option>
                <option>Social Media</option>
                <option>Entrepreneurship Training</option>
                <option>IT Support</option>
              </select>
            </div>

            {error && (
              <div id="signup-error" className="error-msg">
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full" id="signup-btn" disabled={loading}>
              {loading ? (
                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
          <p className="login-switch">
            Already have an account?{' '}
            <a href="#" id="back-to-login-from-signup" onClick={(e) => { e.preventDefault(); onGoToLogin(); }}>
              Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
