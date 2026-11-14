import { useState, useEffect } from 'react';
import { useToast } from '../../components/Toast';
import API from '../../services/api';
import { IndianRupee, Wallet, Send, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

const STATUS_COLORS = {
  confirmed: { bg: '#fef3c7', color: '#d97706', label: 'Confirmed' },
  included_in_payout: { bg: '#dbeafe', color: '#2563eb', label: 'In Payout' },
  paid: { bg: '#dcfce7', color: '#16a34a', label: 'Paid' },
  requested: { bg: '#fff7ed', color: '#ea580c', label: 'Requested' },
  approved: { bg: '#dbeafe', color: '#2563eb', label: 'Approved' },
  processing: { bg: '#fef9c3', color: '#ca8a04', label: 'Processing' },
  rejected: { bg: '#fee2e2', color: '#dc2626', label: 'Rejected' }
};

const StatusBadge = ({ status }) => {
  const s = STATUS_COLORS[status] || { bg: '#f1f5f9', color: '#64748b', label: status };
  return (
    <span style={{
      background: s.bg, color: s.color, padding: '4px 10px',
      borderRadius: '6px', fontSize: '12px', fontWeight: 600,
      textTransform: 'capitalize', display: 'inline-block'
    }}>
      {s.label}
    </span>
  );
};

export function ReferralPortalPayouts() {
  const { showToast } = useToast();
  const [commissions, setCommissions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [tab, setTab] = useState('commissions');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cData, pData] = await Promise.all([
        API.get('/referral-partners/commissions?limit=50'),
        API.get('/referral-partners/payouts')
      ]);
      setCommissions(cData.commissions || []);
      setPayouts(pData.payouts || []);
    } catch (err) {
      showToast(err.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const requestPayout = async () => {
    if (requesting) return;
    setRequesting(true);
    try {
      const result = await API.post('/referral-partners/payouts/request');
      showToast(result.message || 'Payout requested!', 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to request payout', 'error');
    } finally {
      setRequesting(false);
    }
  };

  const confirmedBalance = commissions
    .filter(c => c.status === 'confirmed')
    .reduce((sum, c) => sum + c.commissionAmount, 0);

  const hasPendingPayout = payouts.some(p => ['requested', 'approved', 'processing'].includes(p.status));

  if (loading) {
    return (
      <div className="loading" style={{ height: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <>
      {/* Summary Bar */}
      <div className="stats-grid" style={{ marginBottom: '16px' }}>
        <div className="stat-card">
          <div className="stat-icon green"><IndianRupee size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">₹{confirmedBalance}</div>
            <div className="stat-label">Available for Payout</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><CheckCircle size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">{commissions.filter(c => c.status === 'paid').length}</div>
            <div className="stat-label">Paid Commissions</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><Clock size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">{payouts.filter(p => ['requested', 'approved', 'processing'].includes(p.status)).length}</div>
            <div className="stat-label">Pending Payouts</div>
          </div>
        </div>
      </div>

      {/* Request Payout */}
      {confirmedBalance > 0 && !hasPendingPayout && (
        <div className="glass-card" style={{ padding: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', background: 'rgba(22, 163, 74, 0.05)', border: '1px solid rgba(22, 163, 74, 0.2)' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>Ready to withdraw?</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>You have ₹{confirmedBalance} available for payout</div>
          </div>
          <button className="btn btn-primary" onClick={requestPayout} disabled={requesting} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {requesting ? <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div> : <><Send size={16} /> Request Payout</>}
          </button>
        </div>
      )}

      {hasPendingPayout && (
        <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '16px', background: 'rgba(234, 88, 12, 0.05)', border: '1px solid rgba(234, 88, 12, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ea580c', fontWeight: 600 }}>
            <AlertCircle size={18} /> You have a pending payout request. Please wait for it to be processed.
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          className={`btn ${tab === 'commissions' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTab('commissions')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <IndianRupee size={16} /> Commissions ({commissions.length})
        </button>
        <button
          className={`btn ${tab === 'payouts' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTab('payouts')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Wallet size={16} /> Payouts ({payouts.length})
        </button>
        <button className="btn btn-ghost" onClick={loadData} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Commissions Table */}
      {tab === 'commissions' && (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          {commissions.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>App Fee</th>
                    <th>Rate</th>
                    <th>Commission</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr key={c._id}>
                      <td>
                        <strong>{c.studentName}</strong>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{c.studentEmail}</div>
                      </td>
                      <td>₹{c.applicationFee}</td>
                      <td>{c.commissionPercent}%</td>
                      <td style={{ fontWeight: 700, color: '#16a34a' }}>₹{c.commissionAmount}</td>
                      <td><StatusBadge status={c.status} /></td>
                      <td>{new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <IndianRupee size={32} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
              <p>No commissions yet</p>
              <p style={{ fontSize: '13px' }}>Share your referral code to start earning</p>
            </div>
          )}
        </div>
      )}

      {/* Payouts Table */}
      {tab === 'payouts' && (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          {payouts.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Requested</th>
                    <th>UTR / Reference</th>
                    <th>Processed</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => (
                    <tr key={p._id}>
                      <td style={{ fontWeight: 700, fontSize: '15px' }}>₹{p.amount}</td>
                      <td><StatusBadge status={p.status} /></td>
                      <td>{new Date(p.requestedAt || p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td>{p.utrNumber || p.transactionRef || '-'}</td>
                      <td>{p.processedAt ? new Date(p.processedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>
                      <td>{p.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <Wallet size={32} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
              <p>No payouts yet</p>
              <p style={{ fontSize: '13px' }}>Request a payout when you have available balance</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default ReferralPortalPayouts;
