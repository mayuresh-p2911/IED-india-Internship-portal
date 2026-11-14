import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import API from '../services/api';
import { Wallet, Check, X, Ban, Truck, CreditCard } from 'lucide-react';

const STATUSES = ['', 'requested', 'approved', 'processing', 'paid', 'rejected'];
const STATUS_LABELS = { requested: 'Requested', approved: 'Approved', processing: 'Processing', paid: 'Paid', rejected: 'Rejected' };
const STATUS_STYLES = {
  requested: { background: '#fef3c7', color: '#92400e' },
  approved: { background: '#dbeafe', color: '#1e40af' },
  processing: { background: '#e0e7ff', color: '#3730a3' },
  paid: { background: '#dcfce7', color: '#166534' },
  rejected: { background: '#fee2e2', color: '#991b1b' },
};

export function PayoutManagement() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [statusCounts, setStatusCounts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [actionModal, setActionModal] = useState(null);
  const [actionForm, setActionForm] = useState({ status: '', utrNumber: '', transactionRef: '', remarks: '' });
  const [processing, setProcessing] = useState(false);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await API.get('/referral-partners/admin/payouts?' + params.toString());
      setPayouts(res.payouts || []);
      setTotalPages(res.pages || 1);
      setStatusCounts(res.statusCounts || []);
    } catch (err) {
      showToast(err.message || 'Failed to load payouts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayouts(); }, [page, statusFilter]);

  const getCount = (s) => {
    const found = statusCounts.find(sc => sc._id === s);
    return found ? found.count : 0;
  };

  const openAction = (payout, status) => {
    setActionModal(payout);
    setActionForm({ status, utrNumber: '', transactionRef: '', remarks: '' });
  };

  const handleAction = async (e) => {
    e.preventDefault();
    if (!actionModal) return;
    setProcessing(true);
    try {
      const body = { status: actionForm.status };
      if (actionForm.utrNumber) body.utrNumber = actionForm.utrNumber;
      if (actionForm.transactionRef) body.transactionRef = actionForm.transactionRef;
      if (actionForm.remarks) body.remarks = actionForm.remarks;

      await API.patch(`/referral-partners/admin/payouts/${actionModal._id}`, body);
      showToast(`Payout ${actionForm.status} successfully`, 'success');
      setActionModal(null);
      fetchPayouts();
    } catch (err) {
      showToast(err.message || 'Failed to update payout', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
  const getPartnerName = (p) => p.referralPartnerId?.userId?.name || '-';
  const getPartnerEmail = (p) => p.referralPartnerId?.userId?.email || '-';

  if (loading && payouts.length === 0) {
    return (
      <div className="loading" style={{ height: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wallet size={22} /> Payout Management
        </h2>
        <p className="text-muted" style={{ margin: '4px 0 0' }}>Review and process referral partner payout requests</p>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {STATUSES.map(s => (
          <button
            key={s || 'all'}
            className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            style={{ fontSize: '0.82rem', padding: '6px 14px' }}
          >
            {s ? STATUS_LABELS[s] : 'All'}
            {s && <span style={{ marginLeft: '6px', opacity: 0.7, fontSize: '0.75rem' }}>({getCount(s)})</span>}
          </button>
        ))}
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Partner</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Commissions</th>
                <th>Requested</th>
                <th>Processed</th>
                <th>UTR / Ref</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No payout requests found
                  </td>
                </tr>
              ) : (
                payouts.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div><strong>{getPartnerName(p)}</strong></div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{getPartnerEmail(p)}</div>
                    </td>
                    <td style={{ fontWeight: 700, color: '#03377A', fontSize: '1.05rem' }}>₹{p.amount}</td>
                    <td>
                      <span style={{ ...STATUS_STYLES[p.status] || {}, padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600 }}>
                        {STATUS_LABELS[p.status] || p.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{p.commissions?.length || 0}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{formatDate(p.requestedAt)}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {p.processedAt ? formatDate(p.processedAt) : '-'}
                      {p.processedBy && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>by {p.processedBy.name}</div>}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                      {p.utrNumber || p.transactionRef || '-'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {p.status === 'requested' && (
                          <>
                            <button className="btn btn-primary btn-sm" onClick={() => openAction(p, 'approved')} title="Approve">
                              <Check size={13} />
                            </button>
                            <button className="btn btn-ghost btn-sm" style={{ color: '#dc2626' }} onClick={() => openAction(p, 'rejected')} title="Reject">
                              <Ban size={13} />
                            </button>
                          </>
                        )}
                        {p.status === 'approved' && (
                          <button className="btn btn-primary btn-sm" onClick={() => openAction(p, 'processing')} title="Mark Processing">
                            <Truck size={13} />
                          </button>
                        )}
                        {p.status === 'processing' && (
                          <button className="btn btn-primary btn-sm" onClick={() => openAction(p, 'paid')} title="Mark Paid">
                            <CreditCard size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px' }}>
            <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(pg => pg - 1)}>Previous</button>
            <span style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Page {page} of {totalPages}</span>
            <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(pg => pg + 1)}>Next</button>
          </div>
        )}
      </div>

      {actionModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActionModal(null); }}>
          <div className="modal glass-card">
            <div className="modal-header">
              <h3>
                {actionForm.status === 'approved' && 'Approve Payout'}
                {actionForm.status === 'rejected' && 'Reject Payout'}
                {actionForm.status === 'processing' && 'Mark as Processing'}
                {actionForm.status === 'paid' && 'Mark as Paid'}
              </h3>
              <button className="modal-close" onClick={() => setActionModal(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAction}>
              <div className="modal-body">
                <div style={{ background: 'rgba(3,55,122,0.05)', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{getPartnerName(actionModal)}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{getPartnerEmail(actionModal)}</div>
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#03377A' }}>₹{actionModal.amount}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {actionForm.status === 'paid' && (
                    <div className="form-row">
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>UTR Number *</label>
                        <input
                          type="text"
                          required
                          value={actionForm.utrNumber}
                          onChange={(e) => setActionForm(f => ({ ...f, utrNumber: e.target.value }))}
                          placeholder="Enter UTR number"
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Transaction Ref</label>
                        <input
                          type="text"
                          value={actionForm.transactionRef}
                          onChange={(e) => setActionForm(f => ({ ...f, transactionRef: e.target.value }))}
                          placeholder="Optional reference"
                        />
                      </div>
                    </div>
                  )}
                  <div className="form-group">
                    <label>{actionForm.status === 'rejected' ? 'Rejection Reason *' : 'Remarks'}</label>
                    <textarea
                      rows="3"
                      required={actionForm.status === 'rejected'}
                      value={actionForm.remarks}
                      onChange={(e) => setActionForm(f => ({ ...f, remarks: e.target.value }))}
                      placeholder={actionForm.status === 'rejected' ? 'Provide a reason for rejection' : 'Optional remarks'}
                    ></textarea>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setActionModal(null)}>Cancel</button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={processing}
                  style={actionForm.status === 'rejected' ? { background: '#dc2626' } : {}}
                >
                  {processing ? (
                    <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div>
                  ) : (
                    <>
                      <Check size={14} style={{ marginRight: '4px' }} />
                      {actionForm.status === 'approved' && 'Approve'}
                      {actionForm.status === 'rejected' && 'Reject'}
                      {actionForm.status === 'processing' && 'Mark Processing'}
                      {actionForm.status === 'paid' && 'Mark as Paid'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PayoutManagement;
