import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import API from '../services/api';
import {
  Eye,
  Check,
  Calendar,
  UserCheck,
  X,
  Pause,
  ExternalLink,
  Download,
  FileText,
  Search,
  Filter
} from 'lucide-react';

const STATUS_FLOW = {
  applied: ['shortlisted', 'rejected', 'on_hold'],
  shortlisted: ['interview_scheduled', 'rejected', 'on_hold'],
  interview_scheduled: ['selected', 'rejected', 'on_hold'],
  on_hold: ['shortlisted', 'rejected'],
  selected: [],
  rejected: []
};

const STATUS_LABELS = {
  applied: 'Applied',
  shortlisted: 'Shortlisted',
  interview_scheduled: 'Interview Scheduled',
  selected: 'Selected',
  rejected: 'Rejected',
  on_hold: 'On Hold'
};

const STATUS_COLORS = {
  applied: '#4f8ef7',
  shortlisted: '#00d4ff',
  interview_scheduled: '#ffd700',
  selected: '#00e676',
  rejected: '#ff5252',
  on_hold: '#ff9100'
};

export function Applications() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals State
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectingApp, setRejectingApp] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const canAct = ['admin', 'hr'].includes(user?.role);

  const fetchApps = async (params = {}) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams(params).toString();
      const res = await API.get('/applications' + (qs ? '?' + qs : ''));
      setApps(res.applications || res || []);
    } catch (err) {
      showToast(err.message || 'Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleApplyFilters = () => {
    const params = {};
    if (search.trim()) params.search = search.trim();
    if (statusFilter) params.status = statusFilter;
    fetchApps(params);
  };

  const handleStatusChange = async (app, newStatus) => {
    if (newStatus === 'rejected') {
      setRejectingApp(app);
      setRejectionReason('');
      setRejectionModalOpen(true);
      return;
    }

    if (newStatus === 'selected') {
      if (
        !window.confirm(
          `Accept ${app.name} as an intern?\n\nThis will:\n• Create their portal login account\n• Send login credentials to their email\n• Begin the onboarding process`
        )
      )
        return;
    } else if (newStatus === 'shortlisted') {
      if (!window.confirm(`Shortlist ${app.name}?\nAn email will be sent notifying them of the update.`)) return;
    } else if (newStatus === 'interview_scheduled') {
      showToast('Please schedule the interview in the Interviews tab!', 'info');
      return;
    }

    await changeStatus(app._id, newStatus);
  };

  const changeStatus = async (id, newStatus, reason = '') => {
    try {
      const body = { status: newStatus };
      if (reason) body.rejectionReason = reason;
      await API.patch(`/applications/${id}/status`, body);

      // Update state locally
      setApps((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: newStatus } : a))
      );

      const messages = {
        shortlisted: '✅ Applicant shortlisted. Email sent.',
        rejected: '❌ Rejection email sent to applicant.',
        selected: '🎉 Intern account created! Login credentials emailed.',
        on_hold: 'Application placed on hold.',
        interview_scheduled: 'Status updated.'
      };

      showToast(
        messages[newStatus] || `Status updated to "${STATUS_LABELS[newStatus]}"`,
        newStatus === 'rejected' ? 'info' : 'success'
      );

      if (newStatus === 'shortlisted') {
        showToast('Next step: Go to Interviews to schedule their interview.', 'info');
      }
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleConfirmRejection = async () => {
    if (!rejectingApp) return;
    setRejectionModalOpen(false);
    await changeStatus(rejectingApp._id, 'rejected', rejectionReason);
    setRejectingApp(null);
  };

  const handleOpenDetails = (app) => {
    setSelectedApp(app);
    setDetailsModalOpen(true);
  };

  // Stats computation
  const getStatsCounts = () => {
    const counts = {};
    Object.keys(STATUS_LABELS).forEach((k) => (counts[k] = 0));
    apps.forEach((a) => {
      if (counts[a.status] !== undefined) counts[a.status]++;
    });
    return counts;
  };

  const counts = getStatsCounts();

  const renderStatusIcon = (s) => {
    switch (s) {
      case 'shortlisted':
        return <Check size={12} />;
      case 'interview_scheduled':
        return <Calendar size={12} />;
      case 'selected':
        return <UserCheck size={12} />;
      case 'rejected':
        return <X size={12} />;
      case 'on_hold':
        return <Pause size={12} />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Applications</h2>
          <p>Review and manage internship applications</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div id="app-stats" className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))' }}>
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <div
            key={k}
            className="stat-card"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setStatusFilter(k);
              const params = {};
              if (search.trim()) params.search = search.trim();
              params.status = k;
              fetchApps(params);
            }}
          >
            <div className="stat-info">
              <div className="stat-value" style={{ color: STATUS_COLORS[k] }}>
                {counts[k] || 0}
              </div>
              <div className="stat-label" style={{ fontSize: '.75rem' }}>
                {v}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="filter-bar" style={{ marginTop: '1.5rem' }}>
        <div className="search-input" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ color: 'var(--text-muted)', marginRight: '8px' }} />
          <input
            type="text"
            id="app-search"
            placeholder="Search name, email, college…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyUp={(e) => {
              if (e.key === 'Enter') handleApplyFilters();
            }}
          />
        </div>
        <select
          id="app-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button className="btn btn-secondary" id="app-filter-btn" onClick={handleApplyFilters}>
          <Filter size={16} /> Filter
        </button>
      </div>

      {/* Table */}
      <div className="table-container glass-card" style={{ marginTop: '1rem' }}>
        {loading ? (
          <div className="loading" style={{ padding: '40px' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>College</th>
                <th>Department</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Applied</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {apps.length ? (
                apps.map((a) => {
                  const nextStatuses = canAct ? STATUS_FLOW[a.status] || [] : [];
                  return (
                    <tr key={a._id}>
                      <td style={{ fontWeight: 600 }}>{a.name || ''}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{a.email || ''}</td>
                      <td style={{ fontSize: '0.82rem' }}>{a.college || '—'}</td>
                      <td style={{ fontSize: '0.82rem' }}>{a.department || '—'}</td>
                      <td style={{ fontSize: '0.82rem' }}>{a.duration ? a.duration + ' wks' : '—'}</td>
                      <td>
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor: `${STATUS_COLORS[a.status]}22`,
                            color: STATUS_COLORS[a.status],
                            border: `1px solid ${STATUS_COLORS[a.status]}44`
                          }}
                        >
                          {STATUS_LABELS[a.status] || a.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-sm btn-ghost view-btn"
                            onClick={() => handleOpenDetails(a)}
                            title="View details"
                          >
                            <Eye size={14} />
                          </button>
                          {canAct &&
                            nextStatuses.map((s) => (
                              <button
                                key={s}
                                className={`btn btn-sm ${
                                  s === 'selected'
                                    ? 'btn-primary'
                                    : s === 'rejected'
                                    ? 'btn-danger'
                                    : s === 'shortlisted'
                                    ? 'btn-success'
                                    : 'btn-secondary'
                                } status-btn`}
                                onClick={() => handleStatusChange(a, s)}
                                title={STATUS_LABELS[s]}
                                style={{ display: 'flex', alignItems: 'center', gap: '2px' }}
                              >
                                {renderStatusIcon(s)}
                                <span>{STATUS_LABELS[s]}</span>
                              </button>
                            ))}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-icon">📋</div>
                      <h3>No applications found</h3>
                      <p>Applications submitted by candidates will appear here</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Rejection Modal */}
      {rejectionModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setRejectionModalOpen(false); }}>
          <div className="modal glass-card">
            <div className="modal-header">
              <h3>Reject Application</h3>
              <button className="modal-close" onClick={() => setRejectionModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ color: 'var(--text-secondary)' }}>
                  You are about to reject <strong>{rejectingApp?.name}</strong>'s application. An email will be sent
                  to the applicant.
                </p>
                <div className="form-group">
                  <label>
                    Reason for Rejection <span style={{ color: 'var(--text-muted)' }}>(optional — will be included in the email)</span>
                  </label>
                  <textarea
                    rows="4"
                    placeholder="e.g. We had a high volume of applications this time. We encourage you to apply again..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  ></textarea>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setRejectionModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleConfirmRejection}>
                <X size={14} style={{ marginRight: '4px' }} /> Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsModalOpen && selectedApp && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDetailsModalOpen(false); }}>
          <div className="modal glass-card">
            <div className="modal-header">
              <h3>Application Details</h3>
              <button className="modal-close" onClick={() => setDetailsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '2rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '200px' }}>
                    <div className="form-row">
                      <div>
                        <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Full Name</div>
                        <div style={{ fontWeight: 600 }}>{selectedApp.name || '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Email</div>
                        <div>{selectedApp.email || '—'}</div>
                      </div>
                    </div>
                    <div className="form-row">
                      <div>
                        <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Phone</div>
                        <div>{selectedApp.phone || '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>College</div>
                        <div>{selectedApp.college || '—'}</div>
                      </div>
                    </div>
                    <div className="form-row">
                      <div>
                        <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Department</div>
                        <div>{selectedApp.department || '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Duration</div>
                        <div>{selectedApp.duration ? selectedApp.duration + ' weeks' : '—'}</div>
                      </div>
                    </div>
                    <div className="form-row">
                      <div>
                        <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Status</div>
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor: `${STATUS_COLORS[selectedApp.status]}22`,
                            color: STATUS_COLORS[selectedApp.status]
                          }}
                        >
                          {STATUS_LABELS[selectedApp.status] || selectedApp.status}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Applied On</div>
                        <div>{selectedApp.createdAt ? new Date(selectedApp.createdAt).toLocaleString('en-IN') : '—'}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginBottom: '.4rem' }}>Photo</div>
                    <div
                      style={{
                        width: '110px',
                        height: '130px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        overflow: 'hidden',
                        backgroundColor: '#f0f4f8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {selectedApp.photo ? (
                        <img
                          src={selectedApp.photo}
                          alt="Applicant"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                          onClick={() => window.open(selectedApp.photo, '_blank')}
                        />
                      ) : (
                        <FileText size={40} color="var(--text-muted)" />
                      )}
                    </div>
                  </div>
                </div>

                {(selectedApp.coverLetter || selectedApp.message) && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginBottom: '.4rem' }}>Cover Letter</div>
                    <div
                      style={{
                        backgroundColor: '#f4f6fa',
                        borderRadius: '8px',
                        padding: '1rem',
                        color: 'var(--text-secondary)',
                        fontSize: '.9rem',
                        lineHeight: 1.6,
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      {selectedApp.coverLetter || selectedApp.message}
                    </div>
                  </div>
                )}

                {selectedApp.resume && (
                  <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                      <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Resume</span>
                      <a href={selectedApp.resume} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                        <ExternalLink size={12} style={{ marginRight: '4px' }} /> Open
                      </a>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '360px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        overflow: 'hidden',
                        backgroundColor: '#f0f4f8'
                      }}
                    >
                      {selectedApp.resume.toLowerCase().endsWith('.pdf') ? (
                        <iframe src={selectedApp.resume} style={{ width: '100%', height: '100%', border: 'none' }} title="Resume PDF"></iframe>
                      ) : ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(
                          selectedApp.resume.split('.').pop().toLowerCase()
                        ) ? (
                        <img
                          src={selectedApp.resume}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          alt="Resume Preview"
                        />
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: 'var(--text-muted)',
                            gap: '8px'
                          }}
                        >
                          <FileText size={48} />
                          <span>Preview unavailable</span>
                          <a href={selectedApp.resume} download className="btn btn-primary btn-sm">
                            <Download size={12} style={{ marginRight: '4px' }} /> Download
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDetailsModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Applications;
