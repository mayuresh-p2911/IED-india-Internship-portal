import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import API from '../services/api';
import { formatDate } from '../utils/helpers';
import {
  UserPlus,
  Send,
  Upload,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  FileText,
  ArrowRight
} from 'lucide-react';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^\+?[0-9]{10,15}$/;
const MAX_PDF_BYTES = 5 * 1024 * 1024;

const FALLBACK_POSITIONS = [
  'Digital Marketing Intern',
  'HR & Recruitment Intern',
  'Business Development Intern',
  'Social Media Intern',
  'Entrepreneurship Training Intern',
  'IT Support Intern',
  'Management Intern'
];

const FALLBACK_DEPARTMENTS = [
  'Digital Marketing',
  'HR & Recruitment',
  'Business Development',
  'Social Media',
  'Entrepreneurship Training',
  'IT Support',
  'Management'
];

const FALLBACK_YEARS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  'Final Year',
  'Postgraduate',
  'Recent Graduate'
];

const INITIAL_FORM = {
  fullName: '',
  email: '',
  phone: '',
  college: '',
  department: '',
  currentYear: '',
  technicalSkills: '',
  internshipPosition: '',
  message: ''
};

export function ReferIntern({ onNavigate }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [meta, setMeta] = useState({
    positions: FALLBACK_POSITIONS,
    departments: FALLBACK_DEPARTMENTS,
    years: FALLBACK_YEARS
  });
  const [form, setForm] = useState(INITIAL_FORM);
  const [resumeFile, setResumeFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [createdResult, setCreatedResult] = useState(null);

  useEffect(() => {
    let active = true;
    API.get('/referrals/meta')
      .then((res) => {
        if (!active || !res?.success) return;
        setMeta({
          positions: res.positions?.length ? res.positions : FALLBACK_POSITIONS,
          departments: res.departments?.length ? res.departments : FALLBACK_DEPARTMENTS,
          years: res.years?.length ? res.years : FALLBACK_YEARS
        });
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (submitError) setSubmitError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setSubmitError('');
    if (!file) {
      setResumeFile(null);
      return;
    }

    const isPdfExt = file.name.toLowerCase().endsWith('.pdf');
    const isPdfMime = file.type === 'application/pdf' || file.type === '';
    if (!isPdfExt || !isPdfMime) {
      setResumeFile(null);
      setErrors((prev) => ({ ...prev, resume: 'Only PDF files (.pdf) are allowed.' }));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setResumeFile(null);
      setErrors((prev) => ({ ...prev, resume: 'Resume PDF must be 5MB or smaller.' }));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setResumeFile(file);
    setErrors((prev) => ({ ...prev, resume: '' }));
  };

  const validate = () => {
    const next = {};
    const cleanEmail = form.email.trim().toLowerCase();
    const normalizedPhone = form.phone.trim().replace(/[\s\-()]/g, '');
    const skillsList = form.technicalSkills.split(',').map((s) => s.trim()).filter(Boolean);

    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      next.fullName = 'Please enter the candidate’s full name (at least 2 characters).';
    }
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      next.email = 'Please enter a valid email address.';
    } else if (user?.email && cleanEmail === user.email.toLowerCase()) {
      next.email = 'You cannot refer yourself.';
    }
    if (!normalizedPhone || !PHONE_REGEX.test(normalizedPhone)) {
      next.phone = 'Please enter a valid phone number (10 to 15 digits).';
    }
    if (!form.college.trim()) {
      next.college = 'College / University is required.';
    }
    if (!form.department.trim()) {
      next.department = 'Please select a department.';
    }
    if (!form.currentYear.trim()) {
      next.currentYear = 'Please select current year of study.';
    }
    if (skillsList.length === 0) {
      next.technicalSkills = 'Please enter at least one technical skill (comma-separated).';
    }
    if (!form.internshipPosition) {
      next.internshipPosition = 'Please select an internship position.';
    }
    if (!resumeFile) {
      next.resume = 'Please upload the candidate’s resume in PDF format (max 5MB).';
    }
    if (form.message.length > 1000) {
      next.message = 'Referral message cannot exceed 1000 characters.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setCreatedResult(null);

    if (!validate()) {
      showToast('Please fix the highlighted form errors.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('fullName', form.fullName.trim());
      fd.append('email', form.email.trim().toLowerCase());
      fd.append('phone', form.phone.trim());
      fd.append('college', form.college.trim());
      fd.append('department', form.department.trim());
      fd.append('currentYear', form.currentYear.trim());
      fd.append('technicalSkills', form.technicalSkills.trim());
      fd.append('internshipPosition', form.internshipPosition);
      fd.append('message', form.message.trim());
      fd.append('resume', resumeFile);

      const res = await API.upload('/referrals', fd);
      setCreatedResult(res);
      setForm(INITIAL_FORM);
      setResumeFile(null);
      setErrors({});
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (res?.emailWarning) {
        showToast(res.emailWarning, 'info');
      } else {
        showToast(res.message || 'Referral submitted successfully!', 'success');
      }
    } catch (err) {
      const msg = err.message || 'Failed to submit referral.';
      setSubmitError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Refer an Intern</h2>
          <p>Recommend a talented student for an internship opportunity at IED India</p>
        </div>
        {onNavigate && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onNavigate('my-referrals')}
          >
            View My Referrals <ArrowRight size={15} />
          </button>
        )}
      </div>

      {/* Logged-in Referrer Identity (Read-only) */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(3, 55, 122, 0.12)',
                color: 'var(--accent-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <UserCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Referring As (Verified Account)
              </div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {user?.name || 'Authenticated User'}{' '}
                <span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                  ({user?.email || ''})
                </span>
              </div>
            </div>
          </div>
          <span className="status-badge status-selected">Auto-linked</span>
        </div>
      </div>

      {/* Success State */}
      {createdResult?.referral && (
        <div
          className="glass-card"
          style={{
            padding: '18px 20px',
            marginBottom: '1.25rem',
            borderLeft: '4px solid #10b981'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <CheckCircle2 size={22} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                Referral Submitted — {createdResult.referral.referralId}
              </div>
              <p style={{ margin: '4px 0 8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <strong>{createdResult.referral.fullName}</strong> has been referred for{' '}
                <strong>{createdResult.referral.internshipPosition}</strong> on{' '}
                {formatDate(createdResult.referral.createdAt)}.{' '}
                {createdResult.existingAccountLinked
                  ? 'Linked to their existing portal account and notified via email.'
                  : 'An invitation email with portal registration instructions has been sent.'}
              </p>
              {createdResult.emailWarning && (
                <p style={{ margin: '0 0 8px', color: '#b45309', fontSize: '0.85rem' }}>
                  Note: {createdResult.emailWarning}
                </p>
              )}
              {onNavigate && (
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => onNavigate('my-referrals')}
                >
                  Track in My Referrals <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {submitError && (
        <div
          className="glass-card"
          style={{
            padding: '14px 18px',
            marginBottom: '1.25rem',
            borderLeft: '4px solid #ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#dc2626'
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{submitError}</span>
        </div>
      )}

      {/* Referral Form */}
      <form className="glass-card" style={{ padding: '24px' }} onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
          <UserPlus size={18} style={{ color: 'var(--accent-blue)' }} />
          <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Candidate Information</h3>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="ref-fullName">Full Name *</label>
            <input
              id="ref-fullName"
              name="fullName"
              type="text"
              placeholder="e.g. Aarav Sharma"
              value={form.fullName}
              onChange={handleChange}
              required
            />
            {errors.fullName && <small style={{ color: '#ef4444', marginTop: '4px', display: 'block' }}>{errors.fullName}</small>}
          </div>
          <div className="form-group">
            <label htmlFor="ref-email">Email Address *</label>
            <input
              id="ref-email"
              name="email"
              type="email"
              placeholder="candidate@university.edu"
              value={form.email}
              onChange={handleChange}
              required
            />
            {errors.email && <small style={{ color: '#ef4444', marginTop: '4px', display: 'block' }}>{errors.email}</small>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="ref-phone">Phone Number *</label>
            <input
              id="ref-phone"
              name="phone"
              type="tel"
              placeholder="e.g. 9876543210 or +919876543210"
              value={form.phone}
              onChange={handleChange}
              required
            />
            {errors.phone && <small style={{ color: '#ef4444', marginTop: '4px', display: 'block' }}>{errors.phone}</small>}
          </div>
          <div className="form-group">
            <label htmlFor="ref-college">College / University *</label>
            <input
              id="ref-college"
              name="college"
              type="text"
              placeholder="e.g. National Institute of Technology"
              value={form.college}
              onChange={handleChange}
              required
            />
            {errors.college && <small style={{ color: '#ef4444', marginTop: '4px', display: 'block' }}>{errors.college}</small>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="ref-department">Department *</label>
            <select
              id="ref-department"
              name="department"
              value={form.department}
              onChange={handleChange}
              required
            >
              <option value="">Select Department</option>
              {meta.departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {errors.department && <small style={{ color: '#ef4444', marginTop: '4px', display: 'block' }}>{errors.department}</small>}
          </div>
          <div className="form-group">
            <label htmlFor="ref-currentYear">Current Year of Study *</label>
            <select
              id="ref-currentYear"
              name="currentYear"
              value={form.currentYear}
              onChange={handleChange}
              required
            >
              <option value="">Select Year of Study</option>
              {meta.years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            {errors.currentYear && <small style={{ color: '#ef4444', marginTop: '4px', display: 'block' }}>{errors.currentYear}</small>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="ref-internshipPosition">Internship Position *</label>
            <select
              id="ref-internshipPosition"
              name="internshipPosition"
              value={form.internshipPosition}
              onChange={handleChange}
              required
            >
              <option value="">Select Internship Opportunity</option>
              {meta.positions.map((pos) => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
            {errors.internshipPosition && <small style={{ color: '#ef4444', marginTop: '4px', display: 'block' }}>{errors.internshipPosition}</small>}
          </div>
          <div className="form-group">
            <label htmlFor="ref-technicalSkills">Technical Skills *</label>
            <input
              id="ref-technicalSkills"
              name="technicalSkills"
              type="text"
              placeholder="Comma-separated (e.g. React, SEO, Python, Canva)"
              value={form.technicalSkills}
              onChange={handleChange}
              required
            />
            {errors.technicalSkills && <small style={{ color: '#ef4444', marginTop: '4px', display: 'block' }}>{errors.technicalSkills}</small>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="ref-resume">Resume Upload (PDF only, max 5MB) *</label>
          <div
            style={{
              border: `1px dashed ${errors.resume ? '#ef4444' : 'var(--border-color, rgba(148, 163, 184, 0.35))'}`,
              borderRadius: '10px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <FileText size={18} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.88rem', color: resumeFile ? 'var(--text-primary)' : 'var(--text-muted)', wordBreak: 'break-word' }}>
                {resumeFile
                  ? `${resumeFile.name} (${(resumeFile.size / 1024).toFixed(1)} KB)`
                  : 'No PDF selected'}
              </span>
            </div>
            <label
              htmlFor="ref-resume"
              className="btn btn-sm btn-secondary"
              style={{ cursor: 'pointer', margin: 0 }}
            >
              <Upload size={14} /> {resumeFile ? 'Change PDF' : 'Choose PDF'}
            </label>
            <input
              ref={fileInputRef}
              id="ref-resume"
              name="resume"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
          {errors.resume && <small style={{ color: '#ef4444', marginTop: '4px', display: 'block' }}>{errors.resume}</small>}
        </div>

        <div className="form-group">
          <label htmlFor="ref-message">
            Referral Message <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea
            id="ref-message"
            name="message"
            rows="3"
            maxLength={1000}
            placeholder="Share why you recommend this candidate (projects, strengths, teamwork)..."
            value={form.message}
            onChange={handleChange}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            {errors.message ? (
              <small style={{ color: '#ef4444' }}>{errors.message}</small>
            ) : (
              <span />
            )}
            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              {form.message.length}/1000
            </small>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={submitting}
            onClick={() => {
              setForm(INITIAL_FORM);
              setResumeFile(null);
              setErrors({});
              setSubmitError('');
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          >
            Reset Form
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                Submitting…
              </>
            ) : (
              <>
                <Send size={15} /> Submit Referral
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
}

export default ReferIntern;

