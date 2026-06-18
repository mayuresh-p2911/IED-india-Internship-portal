import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import API from '../services/api';
import { formatDate, statusBadge } from '../utils/helpers';
import { Plus, Check, X, Send } from 'lucide-react';

export function Leaves() {
  const { user, is } = useAuth();
  const { showToast } = useToast();
  
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [type, setType] = useState('sick');
  const [days, setDays] = useState(1);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');

  const isIntern = is('intern');
  const canApprove = is('admin', 'hr', 'mentor');

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const data = await API.get('/leaves');
      setLeaves(data.leaves || []);
    } catch (err) {
      showToast(err.message || 'Failed to load leaves', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // Calculate days when date changes
  useEffect(() => {
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      if (to >= from) {
        const diffTime = Math.abs(to - from);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setDays(diffDays);
      } else {
        setDays(1);
      }
    }
  }, [fromDate, toDate]);

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (!fromDate || !toDate || !reason) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    try {
      await API.post('/leaves', { type, days, fromDate, toDate, reason });
      showToast('Leave application submitted!', 'success');
      setModalOpen(false);
      // Reset form
      setType('sick');
      setDays(1);
      setFromDate('');
      setToDate('');
      setReason('');
      fetchLeaves();
    } catch (err) {
      showToast(err.message || 'Failed to submit leave', 'error');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await API.patch(`/leaves/${id}/status`, { status });
      showToast(`Leave ${status} successfully`, 'success');
      fetchLeaves();
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Leave Management</h2>
          <p>{isIntern ? 'Apply for leave and track your requests' : 'Review and manage leave requests'}</p>
        </div>
        {isIntern && (
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Apply Leave
          </button>
        )}
      </div>

      <div className="table-container glass-card">
        {loading ? (
          <div className="loading" style={{ padding: '40px' }}><div className="spinner"></div></div>
        ) : (
          <table>
            <thead>
              <tr>
                {!isIntern && <th>Intern</th>}
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                {canApprove && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {leaves.length ? (
                leaves.map((l) => (
                  <tr key={l._id}>
                    {!isIntern && (
                      <td>
                        <strong>{l.internId?.name || '-'}</strong>
                        <br />
                        <small className="text-muted">{l.internId?.department || ''}</small>
                      </td>
                    )}
                    <td>
                      <span className="status-badge" style={{ textTransform: 'capitalize' }}>
                        {l.type}
                      </span>
                    </td>
                    <td>{formatDate(l.fromDate)}</td>
                    <td>{formatDate(l.toDate)}</td>
                    <td>
                      <strong>{l.days}</strong>
                    </td>
                    <td style={{ maxWidth: '200px' }}>{l.reason}</td>
                    <td>
                      <span dangerouslySetInnerHTML={{ __html: statusBadge(l.status) }} />
                    </td>
                    {canApprove && (
                      <td className="actions-cell">
                        {l.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleUpdateStatus(l._id, 'approved')}
                              title="Approve"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleUpdateStatus(l._id, 'rejected')}
                              title="Reject"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canApprove ? 8 : 7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No leave records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="modal glass-card">
            <div className="modal-header">
              <h3>Apply for Leave</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmitLeave}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Leave Type</label>
                      <select value={type} onChange={(e) => setType(e.target.value)}>
                        <option value="sick">Sick Leave</option>
                        <option value="casual">Casual Leave</option>
                        <option value="personal">Personal Leave</option>
                        <option value="emergency">Emergency</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Days Count</label>
                      <input type="number" value={days} readOnly style={{ opacity: 0.8 }} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>From Date *</label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>To Date *</label>
                      <input
                        type="date"
                        required
                        min={fromDate || new Date().toISOString().split('T')[0]}
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Reason *</label>
                    <textarea
                      required
                      placeholder="Briefly describe your reason..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                    ></textarea>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Request <Send size={14} style={{ marginLeft: '4px' }} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Leaves;
