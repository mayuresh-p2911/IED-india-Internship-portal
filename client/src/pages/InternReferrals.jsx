import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import API from '../services/api';
import { formatDate, formatDateTime } from '../utils/helpers';
import {
  Search,
  Filter,
  Eye,
  Download,
  RefreshCw,
  X,
  Clock,
  Check,
  AlertCircle,
  Users
} from 'lucide-react';

const REFERRAL_STATUSES = [
  'Pending Review',
  'Under Review',
  'Shortlisted',
  'Interview Scheduled',
  'Selected',
  'Rejected'
];

const STATUS_COLORS = {
  'Pending Review': '#f59e0b',
  'Under Review': '#0284c7',
  'Shortlisted': '#06b6d4',
  'Interview Scheduled': '#8b5cf6',
  'Selected': '#10b981',
  'Rejected': '#ef4444'
};

export function InternReferrals() {
  const { is } = useAuth();
  const { showToast } = useToast();

  const [referrals, setReferrals] = useState([]);
  const [positions, setPositions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');

  // Modals
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [statusModalTarget, setStatusModalTarget] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [downloadingId, setDownloadingId] = useState('');

  const isAdmin = is('admin', 'superadmin');

  const fetchReferrals = async (overrides = null) => {
    setLoading(true);
    setError('');
    try {
      const activeSearch = overrides?.search !== undefined ? overrides.search : search;
      const activeStatus = overrides?.status !== undefined ? overrides.status : statusFilter;
      const activePos = overrides?.internshipPosition !== undefined ? overrides.internshipPosition : positionFilter;

      const params = new URLSearchParams();
      if (activeSearch.trim()) params.append('search', activeSearch.trim());
      if (activeStatus) params.append('status', activeStatus);
      if (activePos) params.append('internshipPosition', activePos);

      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await API.get(`/referrals${query}`);
      setReferrals(res.referrals || []);
      setStats(res.stats || {});
    } catch (err) {
      const msg = err.message || 'Failed to load referrals.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    API.get('/referrals/meta')
      .then((res) => {
        if (res?.positions) setPositions(res.positions);
      })
      .catch(() => {});
    fetchReferrals();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
        <h3>Access Restricted</h3>
        <p style={{ color: 'var(--text-muted)' }}>Only authorized administrators can manage intern referrals.</p>
      </div>
    );
  }

  const handleOpenStatusModal = (refItem) => {
    setStatusModalTarget(refItem);
    const nextDefault = REFERRAL_STATUSES.find((s) => s !== refItem.status) || '';
    setNewStatus(nextDefault);
    setRemarks('');
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!statusModalTarget) return;
    if (!newStatus || newStatus === statusModalTarget.status) {
      showToast('Please select a different status to update.', 'error');
      return;
    }

    setUpdatingStatus(true);
    try {
      const res = await API.patch(`/referrals/${statusModalTarget._id}/status`, {
        status: newStatus,
        remarks: remarks.trim()
      });

      setStatusModalTarget(null);
      if (selectedReferral?._id === res.referral?._id) {
        setSelectedReferral(res.referral);
      }

      if (res?.emailWarning) {
        showToast(res.emailWarning, 'info');
      } else {
        showToast(res.message || 'Referral status updated and notifications sent!', 'success');
      }

      await fetchReferrals();
    } catch (err) {
      showToast(err.message || 'Failed to update referral status.', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

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
      showToast('Resume downloaded!', 'success');
    } catch (err) {
      showToast(err.message || 'Could not download resume.', 'error');
    } finally {
      setDownloadingId('');
    }
  };

  const renderStatusBadge = (status) => {
    const color = STATUS_COLORS[status] || '#64748b';
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

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Intern Referrals</h2>
          <p>Review, verify, and manage student-submitted intern referrals</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => fetchReferrals()} disabled={loading}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Status Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))' }}>
        {REFERRAL_STATUSES.map((st) => (
          <div
            key={st}
            className="stat-card"
            style={{
              cursor: 'pointer',
              outline: statusFilter === st ? `2px solid ${STATUS_COLORS[st]}` : 'none'
            }}
            onClick={() => {
              const nextStatus = statusFilter === st ? '' : st;
              setStatusFilter(nextStatus);
              fetchReferrals({ status: nextStatus });
            }}
          >
            <div className="stat-info">
              <div className="stat-value" style={{ color: STATUS_COLORS[st] }}>
                {stats[st] || 0}
              </div>
              <div className="stat-label" style={{ fontSize: '0.75rem' }}>
                {st}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="filter-bar" style={{ marginTop: '1.25rem', flexWrap: 'wrap' }}>
        <div className="search-input" style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ color: 'var(--text-muted)', marginRight: '8px' }} />
          <input
            type="text"
            placeholder="Search by name, email, or referral ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyUp={(e) => {
              if (e.key === 'Enter') fetchReferrals();
            }}
          />
        </div>
        <select
          value={positionFilter}
          onChange={(e) => {
            setPositionFilter(e.target.value);
            fetchReferrals({ internshipPosition: e.target.value });
          }}
        >
          <option value="">All Positions</option>
          {positions.map((pos) => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            fetchReferrals({ status: e.target.value });
          }}
        >
          <option value="">All Statuses</option>
          {REFERRAL_STATUSES.map((st) => (
            <option key={st} value={st}>{st}</option>
          ))}
        </select>
        <button type="button" className="btn btn-secondary" onClick={() => fetchReferrals()}>
          <Filter size={15} /> Filter
        </button>
        {(search || statusFilter || positionFilter) && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setPositionFilter('');
              fetchReferrals({ search: '', status: '', internshipPosition: '' });
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Error State */}
      {error && !loading && (
        <div
          className="glass-card"
          style={{
            marginTop: '1rem',
            padding: '14px 18px',
            borderLeft: '4px solid #ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#dc2626'
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="table-container glass-card" style={{ marginTop: '1rem' }}>
        {loading ? (
          <div className="loading" style={{ padding: '48px' }}>
            <div className="spinner"></div>
          </div>
        ) : referrals.length === 0 ? (
          <div className="empty-state" style={{ padding: '48px 20px', textAlign: 'center' }}>
            <Users size={36} style={{ color: 'var(--text-muted)', marginBottom: '10px', display: 'inline-block' }} />
            <h3 style={{ margin: '0 0 6px' }}>No referrals found</h3>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Referral ID</th>
                <th>Candidate</th>
                <th>Referred By</th>
                <th>Position</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => (
                <tr key={r._id}>
                  <td style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.82rem' }}>{r.referralId}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.fullName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.email}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.86rem', fontWeight: 500 }}>{r.referrer?.name || '—'}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{r.referrer?.email || ''}</div>
                  </td>
                  <td style={{ fontSize: '0.84rem' }}>{r.internshipPosition}</td>
                  <td>{renderStatusBadge(r.status)}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDate(r.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => setSelectedReferral(r)}
                        title="View details & history"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        disabled={downloadingId === r._id}
                        onClick={() => handleDownloadResume(r)}
                        title="Download PDF resume"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => handleOpenStatusModal(r)}
                      >
                        Update Status
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Complete Referral Detail Modal */}
      {selectedReferral && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedReferral(null);
          }}
        >
          <div className="modal glass-card" style={{ maxWidth: '680px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
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
                  Submitted: {formatDateTime(selectedReferral.createdAt)} | Updated: {formatDateTime(selectedReferral.updatedAt)}
                </span>
              </div>

              <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Candidate Email</div>
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
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Referred By</div>
                  <div>{selectedReferral.referrer?.name || '—'} ({selectedReferral.referrer?.email || ''})</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Portal Account</div>
                  <div>{selectedReferral.referredUser ? 'Existing Account Linked' : 'Not Registered Yet (Invited)'}</div>
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
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Referral Message</div>
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

              <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  disabled={downloadingId === selectedReferral._id}
                  onClick={() => handleDownloadResume(selectedReferral)}
                >
                  <Download size={14} />{' '}
                  {downloadingId === selectedReferral._id
                    ? 'Downloading…'
                    : `Download Resume (${selectedReferral.resume?.originalName || 'PDF'})`}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => handleOpenStatusModal(selectedReferral)}
                >
                  Update Status
                </button>
              </div>

              {/* Status History */}
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Updated by: {entry.updatedBy?.name || 'System'} ({entry.updatedBy?.role || ''})
                      </div>
                      {entry.remarks && (
                        <div style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.82rem' }}>
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

      {/* Update Status Modal */}
      {statusModalTarget && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !updatingStatus) setStatusModalTarget(null);
          }}
        >
          <div className="modal glass-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Update Referral Status</h3>
                <small style={{ color: 'var(--text-muted)' }}>
                  {statusModalTarget.fullName} ({statusModalTarget.referralId})
                </small>
              </div>
              <button
                type="button"
                className="modal-close"
                disabled={updatingStatus}
                onClick={() => setStatusModalTarget(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Current Status</label>
                  <div>{renderStatusBadge(statusModalTarget.status)}</div>
                </div>

                <div className="form-group">
                  <label htmlFor="admin-ref-status">New Status *</label>
                  <select
                    id="admin-ref-status"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    required
                  >
                    {REFERRAL_STATUSES.map((st) => (
                      <option key={st} value={st} disabled={st === statusModalTarget.status}>
                        {st}{st === statusModalTarget.status ? ' (Current)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="admin-ref-remarks">
                    Administrative Remarks <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <textarea
                    id="admin-ref-remarks"
                    rows="3"
                    maxLength={1000}
                    placeholder="Add review notes or feedback (included in email notifications)..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={updatingStatus}
                  onClick={() => setStatusModalTarget(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={updatingStatus}>
                  {updatingStatus ? (
                    <>
                      <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                      Updating…
                    </>
                  ) : (
                    <>
                      <Check size={14} /> Save & Notify
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default InternReferrals;

