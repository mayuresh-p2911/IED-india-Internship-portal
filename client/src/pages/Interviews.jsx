import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import API from '../services/api';
import { formatDate } from '../utils/helpers';
import {
  CalendarPlus,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  Copy,
  Edit2,
  UserCheck,
  UserX,
  X
} from 'lucide-react';

// Subcomponent for scheduled interview row countdown timer
function InterviewCountdown({ scheduledAt }) {
  const [text, setText] = useState('Loading…');

  useEffect(() => {
    const updateTimer = () => {
      const diff = new Date(scheduledAt) - Date.now();
      if (diff <= 0) {
        setText('Starting now');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setText(h > 0 ? `in ${h}h ${m}m` : m > 0 ? `in ${m}m ${s}s` : `in ${s}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [scheduledAt]);

  return <div style={{ fontSize: '.7rem', color: '#00d4ff' }}>{text}</div>;
}

export function Interviews() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [interviews, setInterviews] = useState([]);
  const [shortlistedApps, setShortlistedApps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editingIv, setEditingIv] = useState(null); // null for create mode

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingIvId, setRejectingIvId] = useState(null);
  const [rejectingCandidateName, setRejectingCandidateName] = useState('');
  const [rejectionFeedback, setRejectionFeedback] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    applicationId: '',
    candidateName: '', // display name when editing
    date: '',
    time: '',
    mode: 'zoom',
    interviewer: '',
    meetLink: '',
    status: 'scheduled',
    result: '',
    score: 5,
    feedback: ''
  });

  const canManage = ['admin', 'hr'].includes(user?.role);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const res = await API.get('/interviews');
      setInterviews(res.interviews || res || []);
    } catch (err) {
      showToast(err.message || 'Failed to load interviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchShortlisted = async () => {
    try {
      const res = await API.get('/applications?status=shortlisted');
      setShortlistedApps(res.applications || res || []);
    } catch (_) {
      setShortlistedApps([]);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const handleCopyLink = (link) => {
    navigator.clipboard?.writeText(link).then(() => {
      showToast('Link copied!', 'success');
    });
  };

  const handleCancelInterview = async (id) => {
    if (!window.confirm('Cancel this interview?')) return;
    try {
      await API.put(`/interviews/${id}`, { status: 'cancelled' });
      showToast('Interview cancelled', 'success');
      fetchInterviews();
    } catch (err) {
      showToast(err.message || 'Failed to cancel interview', 'error');
    }
  };

  const decideInterview = async (ivId, accept, rejectionReason = '') => {
    try {
      const payload = accept
        ? { status: 'completed', result: 'pass', acceptIntern: true }
        : { status: 'completed', result: 'fail', rejectIntern: true, rejectionReason };

      await API.put(`/interviews/${ivId}`, payload);

      if (accept) {
        showToast('🎉 Intern accepted! Account created & credentials emailed.', 'success');
      } else {
        showToast('Rejection email sent to candidate.', 'info');
      }
      fetchInterviews();
    } catch (err) {
      showToast(err.message || 'Failed to update interview result', 'error');
    }
  };

  const handleAcceptIntern = (ivId, name) => {
    if (
      !window.confirm(
        `Accept ${name} as an intern?\n\nThis will:\n• Create their portal login account\n• Send login credentials (User ID + Password) to their email`
      )
    )
      return;
    decideInterview(ivId, true);
  };

  const handleOpenRejectModal = (ivId, name) => {
    setRejectingIvId(ivId);
    setRejectingCandidateName(name);
    setRejectionFeedback('');
    setRejectModalOpen(true);
  };

  const handleConfirmRejection = () => {
    setRejectModalOpen(false);
    decideInterview(rejectingIvId, false, rejectionFeedback);
  };

  const handleOpenScheduleModal = async (iv = null) => {
    await fetchShortlisted();
    if (iv) {
      setEditingIv(iv);
      const scheduledDate = iv.scheduledAt ? iv.scheduledAt.slice(0, 10) : '';
      const scheduledTime = iv.scheduledAt ? new Date(iv.scheduledAt).toTimeString().slice(0, 5) : '';
      setFormData({
        applicationId: iv.applicationId?._id || iv.applicationId || '',
        candidateName: iv.applicationId?.name || iv.candidateName || '—',
        date: scheduledDate,
        time: scheduledTime,
        mode: iv.mode || 'zoom',
        interviewer: iv.interviewer || iv.interviewedBy?.name || '',
        meetLink: iv.meetLink || '',
        status: iv.status || 'scheduled',
        result: iv.result === 'pending' ? '' : iv.result || '',
        score: iv.score ?? 5,
        feedback: iv.feedback || ''
      });
    } else {
      setEditingIv(null);
      setFormData({
        applicationId: '',
        candidateName: '',
        date: '',
        time: '',
        mode: 'zoom',
        interviewer: '',
        meetLink: '',
        status: 'scheduled',
        result: '',
        score: 5,
        feedback: ''
      });
    }
    setScheduleModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveInterview = async (e) => {
    e.preventDefault();
    const { applicationId, date, time, mode, interviewer, meetLink, status, result, score, feedback } = formData;

    if (!date || !time || !mode) {
      showToast('Date, time and mode are required', 'error');
      return;
    }

    const scheduledAt = new Date(`${date}T${time}`).toISOString();
    const payload = { scheduledAt, mode, interviewer, meetLink };

    if (!editingIv) {
      if (!applicationId) {
        showToast('Please select a candidate', 'error');
        return;
      }
      payload.applicationId = applicationId;
    } else {
      payload.status = status;
      payload.result = result || 'pending';
      payload.score = parseInt(score) || undefined;
      payload.feedback = feedback.trim();
    }

    try {
      if (editingIv) {
        await API.put(`/interviews/${editingIv._id}`, payload);
        showToast('Interview updated', 'success');
      } else {
        await API.post('/interviews', payload);
        showToast('Interview scheduled! Candidate notified by email.', 'success');
      }
      setScheduleModalOpen(false);
      fetchInterviews();
    } catch (err) {
      showToast(err.message || 'Failed to save interview', 'error');
    }
  };

  // Stats computation
  const getStats = () => {
    const counts = { scheduled: 0, completed: 0, pending: 0, cancelled: 0 };
    interviews.forEach((iv) => {
      if (iv.status === 'scheduled') counts.scheduled++;
      else if (iv.status === 'completed') counts.completed++;
      else if (iv.status === 'pending') counts.pending++;
      else if (iv.status === 'cancelled') counts.cancelled++;
    });
    return counts;
  };

  const counts = getStats();
  const statDefs = [
    { key: 'scheduled', label: 'Scheduled', icon: Calendar, color: 'blue' },
    { key: 'completed', label: 'Completed', icon: CheckCircle, color: 'green' },
    { key: 'pending', label: 'Pending', icon: Clock, color: 'gold' },
    { key: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'red' }
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Interviews</h2>
          <p>Schedule and manage candidate interviews</p>
        </div>
        <div className="page-actions">
          {canManage && (
            <button className="btn btn-primary" onClick={() => handleOpenScheduleModal(null)}>
              <CalendarPlus size={16} /> Schedule Interview
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div id="iv-stats" className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))' }}>
        {statDefs.map((d) => {
          const Icon = d.icon;
          return (
            <div className="stat-card" key={d.key}>
              <div className={`stat-icon ${d.color}`}>
                <Icon size={20} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{counts[d.key] || 0}</div>
                <div className="stat-label">{d.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="table-container glass-card" style={{ marginTop: '1.5rem' }}>
        <table>
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Date & Time</th>
              <th>Mode</th>
              <th>Meet Link</th>
              <th>Interviewer</th>
              <th>Status</th>
              <th>Score</th>
              <th>Result</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {interviews.length ? (
              interviews.map((iv) => {
                const isFuture = iv.scheduledAt && new Date(iv.scheduledAt) > new Date();
                const modeBadge = { zoom: 'blue', google_meet: 'green', offline: 'gold', phone: 'purple' }[iv.mode] || 'blue';
                const resultColor = iv.result === 'pass' ? '#00e676' : iv.result === 'fail' ? '#ff5252' : '#94a3b8';
                const candidateName = iv.applicationId?.name || iv.candidateName || '—';
                const isCompleted = iv.status === 'completed';
                const appStatus = iv.applicationId?.status;
                const alreadyActed = appStatus === 'selected' || appStatus === 'rejected';

                return (
                  <tr key={iv._id}>
                    <td style={{ fontWeight: 600 }}>{candidateName}</td>
                    <td>
                      {formatDate(iv.scheduledAt || iv.scheduledDate)}
                      <br />
                      <span style={{ color: 'var(--text-muted)', fontSize: '.8rem' }}>
                        {iv.scheduledAt ? new Date(iv.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </span>
                      {isFuture && <InterviewCountdown scheduledAt={iv.scheduledAt} />}
                    </td>
                    <td>
                      <span className={`status-badge status-${modeBadge}`}>
                        {(iv.mode || '—').replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      {iv.meetLink ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                          <a href={iv.meetLink} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost">
                            <ExternalLink size={14} />
                          </a>
                          <button className="btn btn-sm btn-ghost copy-link-btn" onClick={() => handleCopyLink(iv.meetLink)}>
                            <Copy size={14} />
                          </button>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ fontSize: '.85rem' }}>{iv.interviewer || iv.interviewedBy?.name || '—'}</td>
                    <td>
                      <span className={`status-badge status-${iv.status}`}>{iv.status || '—'}</span>
                    </td>
                    <td>
                      <strong>{iv.score != null ? iv.score + '/10' : '—'}</strong>
                    </td>
                    <td style={{ color: resultColor, fontWeight: 600 }}>
                      {iv.result && iv.result !== 'pending'
                        ? iv.result.charAt(0).toUpperCase() + iv.result.slice(1)
                        : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
                        {canManage && (
                          <button
                            className="btn btn-sm btn-secondary edit-iv-btn"
                            onClick={() => handleOpenScheduleModal(iv)}
                            title="Edit / Record Result"
                          >
                            <Edit2 size={12} />
                          </button>
                        )}
                        {canManage && isCompleted && !alreadyActed && (
                          <>
                            <button
                              className="btn btn-sm btn-success accept-iv-btn"
                              onClick={() => handleAcceptIntern(iv._id, candidateName)}
                              title="Accept Intern — create account & send credentials"
                            >
                              <UserCheck size={12} style={{ marginRight: '2px' }} /> Accept
                            </button>
                            <button
                              className="btn btn-sm btn-danger reject-iv-btn"
                              onClick={() => handleOpenRejectModal(iv._id, candidateName)}
                              title="Reject after interview"
                            >
                              <UserX size={12} style={{ marginRight: '2px' }} /> Reject
                            </button>
                          </>
                        )}
                        {canManage && iv.status !== 'cancelled' && !isCompleted && (
                          <button className="btn btn-sm btn-danger cancel-iv-btn" onClick={() => handleCancelInterview(iv._id)}>
                            <X size={12} />
                          </button>
                        )}
                        {alreadyActed && (
                          <span
                            className="status-badge"
                            style={{
                              background: appStatus === 'selected' ? '#00e67622' : '#ff525222',
                              color: appStatus === 'selected' ? '#00e676' : '#ff5252'
                            }}
                          >
                            {appStatus === 'selected' ? 'Accepted' : 'Rejected'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state">
                    <div className="empty-icon">📅</div>
                    <h3>No interviews scheduled</h3>
                    <p>Schedule an interview for a shortlisted candidate</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setRejectModalOpen(false); }}>
          <div className="modal glass-card">
            <div className="modal-header">
              <h3>Reject After Interview</h3>
              <button className="modal-close" onClick={() => setRejectModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ color: 'var(--text-secondary)' }}>
                  You are about to reject <strong>{rejectingCandidateName}</strong> after their interview. An email
                  with the outcome will be sent.
                </p>
                <div className="form-group">
                  <label>
                    Feedback / Reason <span style={{ color: 'var(--text-muted)' }}>(optional — sent in email)</span>
                  </label>
                  <textarea
                    rows="4"
                    placeholder="e.g. We appreciated your time but we found a better fit..."
                    value={rejectionFeedback}
                    onChange={(e) => setRejectionFeedback(e.target.value)}
                  ></textarea>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setRejectModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleConfirmRejection}>
                <UserX size={14} style={{ marginRight: '4px' }} /> Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {scheduleModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setScheduleModalOpen(false); }}>
          <div className="modal glass-card">
            <div className="modal-header">
              <h3>{editingIv ? 'Update Interview' : 'Schedule Interview'}</h3>
              <button className="modal-close" onClick={() => setScheduleModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveInterview}>
              <div className="modal-body">
                <div className="form-section">
                  {!editingIv ? (
                    <div className="form-group">
                      <label>Candidate (Shortlisted Application) *</label>
                      <select
                        name="applicationId"
                        value={formData.applicationId}
                        onChange={handleFormChange}
                        required
                      >
                        <option value="">Select candidate…</option>
                        {shortlistedApps.map((a) => (
                          <option key={a._id} value={a._id}>
                            {a.name || a.applicantName} — {a.college || ''}
                          </option>
                        ))}
                        {shortlistedApps.length === 0 && <option disabled>No shortlisted candidates</option>}
                      </select>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label>Candidate</label>
                      <input value={formData.candidateName} disabled style={{ opacity: 0.7 }} />
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Date *</label>
                      <input
                        type="date"
                        name="date"
                        required
                        value={formData.date}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Time *</label>
                      <input
                        type="time"
                        name="time"
                        required
                        value={formData.time}
                        onChange={handleFormChange}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Mode *</label>
                      <select name="mode" value={formData.mode} onChange={handleFormChange} required>
                        <option value="zoom">Zoom</option>
                        <option value="google_meet">Google Meet</option>
                        <option value="offline">Offline</option>
                        <option value="phone">Phone</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Interviewer Name</label>
                      <input
                        type="text"
                        name="interviewer"
                        value={formData.interviewer}
                        onChange={handleFormChange}
                        placeholder="Name of interviewer"
                      />
                    </div>
                  </div>

                  {(formData.mode === 'zoom' || formData.mode === 'google_meet') && (
                    <div className="form-group" id="meet-link-group">
                      <label>Meet Link</label>
                      <input
                        type="url"
                        name="meetLink"
                        value={formData.meetLink}
                        onChange={handleFormChange}
                        placeholder="https://meet.google.com/…"
                      />
                    </div>
                  )}

                  {editingIv && (
                    <>
                      <hr style={{ borderColor: 'var(--border-color)', margin: '1.5rem 0' }} />
                      <h4 style={{ marginBottom: '.75rem' }}>Interview Result</h4>
                      <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                          <label>Status</label>
                          <select name="status" value={formData.status} onChange={handleFormChange}>
                            <option value="scheduled">Scheduled</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label>Result</label>
                          <select name="result" value={formData.result} onChange={handleFormChange}>
                            <option value="">— Pending —</option>
                            <option value="pass">Pass ✅</option>
                            <option value="fail">Fail ❌</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>
                          Score (1–10): <strong id="score-val">{formData.score}</strong>
                        </label>
                        <input
                          type="range"
                          name="score"
                          min="1"
                          max="10"
                          step="1"
                          value={formData.score}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="form-group">
                        <label>Feedback / Notes</label>
                        <textarea
                          name="feedback"
                          rows="3"
                          placeholder="Interview feedback…"
                          value={formData.feedback}
                          onChange={handleFormChange}
                        ></textarea>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setScheduleModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingIv ? 'Update Interview' : 'Schedule & Notify Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Interviews;
