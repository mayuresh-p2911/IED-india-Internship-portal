import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import API from '../services/api';
import { CreditCard, Search, Filter, Eye, X } from 'lucide-react';

const DEPARTMENTS = ['', 'Digital Marketing', 'HR & Recruitment', 'Business Development', 'Social Media', 'Entrepreneurship Training', 'IT Support'];

const PAYMENT_STATUS_STYLES = {
  paid: { background: '#dcfce7', color: '#166534' },
  pending: { background: '#fef3c7', color: '#92400e' },
  failed: { background: '#fee2e2', color: '#991b1b' },
};

export function PaymentTransactions() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detailApp, setDetailApp] = useState(null);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '25', page: String(page) });
      if (search.trim()) params.set('search', search.trim());
      if (deptFilter) params.set('department', deptFilter);
      const res = await API.get('/applications?' + params.toString());
      const all = res.applications || [];
      setApps(all.filter(a => a.payment && a.payment.paymentId));
      setTotalPages(res.pages || 1);
    } catch (err) {
      showToast(err.message || 'Failed to load payment data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApps(); }, [page]);

  const handleFilter = () => { setPage(1); fetchApps(); };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  if (loading) {
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
          <CreditCard size={22} /> Payment Transactions
        </h2>
        <p className="text-muted" style={{ margin: '4px 0 0' }}>View all application payment records</p>
      </div>

      <div className="glass-card" style={{ padding: '16px', marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 1, minWidth: '180px', marginBottom: 0 }}>
          <label style={{ fontSize: '0.8rem' }}>Search</label>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Name, email, payment ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
              style={{ paddingLeft: '32px' }}
            />
          </div>
        </div>
        <div className="form-group" style={{ minWidth: '160px', marginBottom: 0 }}>
          <label style={{ fontSize: '0.8rem' }}>Department</label>
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {DEPARTMENTS.filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleFilter} style={{ height: '40px' }}>
          <Filter size={14} style={{ marginRight: '4px' }} /> Filter
        </button>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Department</th>
                <th>Amount</th>
                <th>Payment ID</th>
                <th>Status</th>
                <th>Referral Code</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {apps.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No payment transactions found
                  </td>
                </tr>
              ) : (
                apps.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <div><strong>{a.name}</strong></div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.email}</div>
                    </td>
                    <td>{a.department || '-'}</td>
                    <td style={{ fontWeight: 700, color: '#03377A' }}>₹{a.payment?.amount || 0}</td>
                    <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{a.payment?.paymentId || '-'}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          ...PAYMENT_STATUS_STYLES[a.payment?.status] || {},
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}
                      >
                        {a.payment?.status || 'unknown'}
                      </span>
                    </td>
                    <td>
                      {a.referralCode ? (
                        <span style={{ background: '#ede9fe', color: '#5b21b6', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                          {a.referralCode}
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{formatDate(a.payment?.paidAt || a.createdAt)}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDetailApp(a)} title="View Details">
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px' }}>
            <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Page {page} of {totalPages}</span>
            <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}
      </div>

      {detailApp && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDetailApp(null); }}>
          <div className="modal glass-card">
            <div className="modal-header">
              <h3>Payment Details</h3>
              <button className="modal-close" onClick={() => setDetailApp(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="form-row">
                  <div style={{ flex: 1 }}><label className="text-muted" style={{ fontSize: '0.78rem' }}>Student</label><div style={{ fontWeight: 600 }}>{detailApp.name}</div></div>
                  <div style={{ flex: 1 }}><label className="text-muted" style={{ fontSize: '0.78rem' }}>Email</label><div>{detailApp.email}</div></div>
                </div>
                <div className="form-row">
                  <div style={{ flex: 1 }}><label className="text-muted" style={{ fontSize: '0.78rem' }}>Department</label><div>{detailApp.department}</div></div>
                  <div style={{ flex: 1 }}><label className="text-muted" style={{ fontSize: '0.78rem' }}>Amount</label><div style={{ fontWeight: 700, color: '#03377A', fontSize: '1.1rem' }}>₹{detailApp.payment?.amount || 0}</div></div>
                </div>
                <div className="form-row">
                  <div style={{ flex: 1 }}><label className="text-muted" style={{ fontSize: '0.78rem' }}>Payment ID</label><div style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{detailApp.payment?.paymentId || '-'}</div></div>
                  <div style={{ flex: 1 }}><label className="text-muted" style={{ fontSize: '0.78rem' }}>Order ID</label><div style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{detailApp.payment?.orderId || '-'}</div></div>
                </div>
                <div className="form-row">
                  <div style={{ flex: 1 }}><label className="text-muted" style={{ fontSize: '0.78rem' }}>Status</label><div><span className="status-badge" style={{ ...PAYMENT_STATUS_STYLES[detailApp.payment?.status] || {}, padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600, textTransform: 'capitalize' }}>{detailApp.payment?.status}</span></div></div>
                  <div style={{ flex: 1 }}><label className="text-muted" style={{ fontSize: '0.78rem' }}>Paid At</label><div>{formatDate(detailApp.payment?.paidAt)}</div></div>
                </div>
                {detailApp.referralCode && (
                  <div>
                    <label className="text-muted" style={{ fontSize: '0.78rem' }}>Referral Code</label>
                    <div style={{ fontWeight: 600, color: '#5b21b6' }}>{detailApp.referralCode}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDetailApp(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentTransactions;
