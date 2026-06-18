import { useState, useRef } from 'react';
import { ArrowLeft, User, Briefcase, Paperclip, Send } from 'lucide-react';

export function ApplyPage({ onBackToLogin }) {
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const fd = new FormData(formRef.current);
      const res = await fetch('/api/applications', {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to submit application.');
      }
      setSuccess(true);
      formRef.current.reset();
    } catch (err) {
      setError(err.message || 'An error occurred during submission.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="apply-page" className="apply-page">
      <div className="apply-header">
        <button id="back-to-login" className="btn btn-ghost" onClick={onBackToLogin}>
          <ArrowLeft size={16} /> Back to Login
        </button>
        <h1>Apply for Internship</h1>
        <p>IED India Pvt Ltd</p>
      </div>
      <div className="apply-container">
        <form
          ref={formRef}
          id="apply-form"
          className="apply-form"
          onSubmit={handleSubmit}
          encType="multipart/form-data"
        >
          <div className="form-section">
            <h3>
              <User size={18} style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'text-bottom' }} />{' '}
              Personal Information
            </h3>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" name="name" required placeholder="Your full name" />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" name="email" required placeholder="your@email.com" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone *</label>
                <input type="tel" name="phone" required placeholder="10-digit number" />
              </div>
              <div className="form-group">
                <label>College/University *</label>
                <input type="text" name="college" required placeholder="College name" />
              </div>
            </div>
            <div className="form-group">
              <label>Course/Degree</label>
              <input type="text" name="course" placeholder="e.g. B.Tech Computer Science" />
            </div>
          </div>

          <div className="form-section">
            <h3>
              <Briefcase size={18} style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'text-bottom' }} />{' '}
              Internship Preferences
            </h3>
            <div className="form-row">
              <div className="form-group">
                <label>Department *</label>
                <select name="department" required defaultValue="">
                  <option value="" disabled>
                    Select Department
                  </option>
                  <option>Digital Marketing</option>
                  <option>HR & Recruitment</option>
                  <option>Business Development</option>
                  <option>Social Media</option>
                  <option>Entrepreneurship Training</option>
                  <option>IT Support</option>
                </select>
              </div>
              <div className="form-group">
                <label>Duration (Weeks) *</label>
                <select name="duration" required defaultValue="8">
                  <option value="4">4 Weeks</option>
                  <option value="6">6 Weeks</option>
                  <option value="8">8 Weeks</option>
                  <option value="10">10 Weeks</option>
                  <option value="12">12 Weeks</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Cover Letter / About You</label>
              <textarea
                name="coverLetter"
                rows="4"
                placeholder="Tell us about yourself and why you want to intern at IED India..."
              ></textarea>
            </div>
          </div>

          <div className="form-section">
            <h3>
              <Paperclip size={18} style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'text-bottom' }} />{' '}
              Documents
            </h3>
            <div className="form-row">
              <div className="form-group">
                <label>Resume (PDF) *</label>
                <input type="file" name="resume" accept=".pdf,.doc,.docx" required />
              </div>
              <div className="form-group">
                <label>Passport Photo</label>
                <input type="file" name="photo" accept="image/*" />
              </div>
            </div>
          </div>

          {success && (
            <div id="apply-msg" className="apply-msg-success">
              <div className="toast success" style={{ position: 'static', animation: 'none', width: '100%' }}>
                <span>Application submitted successfully! We will get back to you soon.</span>
              </div>
            </div>
          )}

          {error && (
            <div id="apply-msg" className="error-msg">
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? (
              <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
            ) : (
              <>
                Submit Application <Send size={16} style={{ marginLeft: '6px' }} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ApplyPage;
