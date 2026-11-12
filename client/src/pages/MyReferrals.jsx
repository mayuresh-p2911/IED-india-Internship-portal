import { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import API from '../services/api';
import { formatDate, formatDateTime } from '../utils/helpers';
import {
  Eye,
  X,
  Download,
  UserPlus,
  RefreshCw,
  Clock,
  AlertCircle,
  ClipboardList
} from 'lucide-react';

const REFERRAL_STATUS_COLORS = {
  'Pending Review': '#f59e0b',
  'Under Review': '#0284c7',
  'Shortlisted': '#06b6d4',
  'Interview Scheduled': '#8b5cf6',
  'Selected': '#10b981',
  'Rejected': '#ef4444'
};

export function MyReferrals({ onNavigate }) {
  const { showToast } = useToast();

  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [downloadingId, setDownloadingId] = useState('');

  const fetchMyReferrals = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/referrals/my');
      setReferrals(res.referrals || []);
    } catch (err) {
      const msg = err.message || 'Failed to load your referrals.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReferrals();
  }, []);

  const handleDownloadResume = async (refItem) => {
    setDownloadingId(refItem._id);
    try {
      const token = localStorage.getItem('ied_token') || '';
      const response = await fetch(`/api/referrals/${refItem._id}/resume`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        let msg = 'Failed to download resume.';
        try {
          const d = await response.json();
          msg = d.message || msg;
        } catch (_) {}
        throw new Error(msg);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = refItem.resume?.originalName || `${refItem.referralId}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showToast(err.message || 'Could not download resume.', 'error');
    } finally {
      setDownloadingId('');
    }
  };

  const renderStatusBadge = (status) => {
    const color = REFERRAL_STATUS_COLORS[status] || '#64748b';
    return (
      <span
        className="status-badge"
        style={{
          backgroundColor: `${color}22`,
          color,
          border: `1px solid ${color}44`
        }}
      >
        {status}
      </span>
    );
  };

  const selectedCount = referrals.filter((r) => r.status === 'Selected').length;
  const activeCount = referrals.filter((r) => !['Selected', 'Rejected'].includes(r.status)).length;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>My Referrals</h2>
          <p>Track the status and progress of referrals you have submitted</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={fetchMyReferrals} disabled={loading}>
            <RefreshCw size={15} /> Refresh
          </button>
          {onNavigate && (
            <button type="button" className="btn btn-primary" onClick={() => onNavigate('refer-intern')}>
              <UserPlus size={15} /> Refer an Intern
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>{referrals.length}</div>
            <div className="stat-label">Total Referrals</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-value" style={{ color: '#f59e0b' }}>{activeCount}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-value" style={{ color: '#10b981' }}>{selectedCount}</div>
            <div className="stat-label">Selected</div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && !loading && (
        <div
          className="glass-card"
          style={{
            marginTop: '1rem',
            padding: '16px 20px',
            borderLeft: '4px solid #ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button type="button" className="btn btn-sm btn-secondary" onClick={fetchMyReferrals}>
            Try Again
          </button>
        </div>
      )}

      {/* Table / Empty / Loading */}
      <div className="table-container glass-card" style={{ marginTop: '1.25rem' }}>
        {loading ? (
          <div className="loading" style={{ padding: '48px' }}>
            <div className="spinner"></div>
          </div>
        ) : referrals.length === 0 ? (
          <div className="empty-state" style={{ padding: '48px 20px', textAlign: 'center' }}>
            <ClipboardList size={38} style={{ color: 'var(--text-muted)', marginBottom: '10px', display: 'inline-block' }} />
            <h3 style={{ margin: '0 0 6px' }}>No referrals submitted yet</h3>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 16px' }}>
              Refer talented students for open internship roles and track their review progress here.
            </p>
            {onNavigate && (
              <button type="button" className="btn btn-primary" onClick={() => onNavigate('refer-intern')}>
                <UserPlus size={15} /> Refer an Intern
              </button>
            )}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Referral ID</th>
                <th>Referred Student</th>
                <th>Internship Position</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => (
                <tr key={r._id}>
                  <td style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.84rem' }}>{r.referralId}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.fullName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.email}</div>
                  </td>
                  <td style={{ fontSize: '0.86rem' }}>{r.internshipPosition}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{formatDate(r.createdAt)}</td>
                  <td>{renderStatusBadge(r.status)}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{formatDate(r.updatedAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => setSelectedReferral(r)}
                      title="View referral details"
                    >
                      <Eye size={14} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Referral Details Modal */}
      {selectedReferral && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedReferral(null);
          }}
        >
          <div className="modal glass-card" style={{ maxWidth: '640px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>{selectedReferral.fullName}</h3>
                <small style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  {selectedReferral.referralId}
                </small>
              </div>
              <button type="button" className="modal-close" onClick={() => setSelectedReferral(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                {renderStatusBadge(selectedReferral.status)}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Last updated: {formatDateTime(selectedReferral.updatedAt)}
                </span>
              </div>

              <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email</div>
                  <div>{selectedReferral.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phone</div>
                  <div>{selectedReferral.phone}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>College / University</div>
                  <div>{selectedReferral.college}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Department</div>
                  <div>{selectedReferral.department}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Year</div>
                  <div>{selectedReferral.currentYear}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Internship Position</div>
                  <div style={{ fontWeight: 600 }}>{selectedReferral.internshipPosition}</div>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Technical Skills</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(selectedReferral.technicalSkills || []).map((skill, idx) => (
                    <span key={idx} className="status-badge status-applied" style={{ fontSize: '0.75rem' }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {selectedReferral.message && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Your Referral Message</div>
                  <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.55, color: 'var(--text-secondary)' }}>
                    {selectedReferral.message}
                  </p>
                </div>
              )}

              {selectedReferral.adminRemarks && (
                <div
                  style={{
                    marginBottom: '16px',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'rgba(3, 55, 122, 0.08)',
                    borderLeft: '3px solid var(--accent-blue)'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Latest Admin Remarks</div>
                  <div style={{ fontSize: '0.88rem' }}>{selectedReferral.adminRemarks}</div>
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  disabled={downloadingId === selectedReferral._id}
                  onClick={() => handleDownloadResume(selectedReferral)}
                >
                  <Download size={14} />{' '}
                  {downloadingId === selectedReferral._id ? 'Downloading…' : 'Download Submitted Resume (PDF)'}
                </button>
              </div>

              {/* Status History */}
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} /> Status History
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(selectedReferral.statusHistory || []).slice().reverse().map((entry, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color, rgba(148, 163, 184, 0.2))',
                        fontSize: '0.84rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                        <span>
                          {entry.previousStatus ? `${entry.previousStatus} → ` : ''}
                          <strong>{entry.newStatus}</strong>
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                          {formatDateTime(entry.updatedAt)}
                        </span>
                      </div>
                      {entry.remarks && (
                        <div style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.8rem' }}>
                          Remarks: {entry.remarks}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setSelectedReferral(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MyReferrals;

