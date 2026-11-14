import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import API from '../services/api';
import { Users, Search, Eye, X, Copy } from 'lucide-react';

export function ReferralPartnerManagement() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [detailPartner, setDetailPartner] = useState(null);
  const [partnerCommissions, setPartnerCommissions] = useState([]);
  const [loadingCommissions, setLoadingCommissions] = useState(false);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search.trim()) params.set('search', search.trim());
      const res = await API.get('/referral-partners/admin/all?' + params.toString());
      setPartners(res.partners || []);
      setTotalPages(res.pages || 1);
    } catch (err) {
      showToast(err.message || 'Failed to load referral partners', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPartners(); }, [page]);

  const handleSearch = () => { setPage(1); fetchPartners(); };

  const openDetail = async (partner) => {
    setDetailPartner(partner);
    setLoadingCommissions(true);
    try {
      const res = await API.get('/referral-partners/admin/commissions?limit=50');
      const filtered = (res.commissions || []).filter(c => c.referralPartnerId?._id === partner._id);
      setPartnerCommissions(filtered);
    } catch (_) {
      setPartnerCommissions([]);
    } finally {
      setLoadingCommissions(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).then(
      () => showToast('Referral code copied!', 'success'),
      () => {}
    );
  };

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
          <Users size={22} /> Referral Partners
        </h2>
        <p className="text-muted" style={{ margin: '4px 0 0' }}>Manage referral partner accounts and track performance</p>
      </div>

      <div className="glass-card" style={{ padding: '16px', marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
          <label style={{ fontSize: '0.8rem' }}>Search</label>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{ paddingLeft: '32px' }}
            />
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleSearch} style={{ height: '40px' }}>
          <Search size={14} style={{ marginRight: '4px' }} /> Search
        </button>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Partner</th>
                <th>Referral Code</th>
                <th>Total Referred</th>
                <th>Total Earnings</th>
                <th>Available Balance</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {partners.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No referral partners found
                  </td>
                </tr>
              ) : (
                partners.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div><strong>{p.userId?.name || '-'}</strong></div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.userId?.email || '-'}</div>
                    </td>
                    <td>
                      <span
                        style={{ background: '#ede9fe', color: '#5b21b6', padding: '4px 10px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.5px', cursor: 'pointer' }}
                        onClick={() => copyCode(p.referralCode)}
                        title="Click to copy"
                      >
                        {p.referralCode} <Copy size={11} style={{ marginLeft: '2px', verticalAlign: 'middle' }} />
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{p.totalReferred || 0}</td>
                    <td style={{ fontWeight: 700, color: '#16a34a' }}>₹{p.totalEarnings || 0}</td>
                    <td style={{ fontWeight: 600, color: '#03377A' }}>₹{p.availableBalance || 0}</td>
                    <td>
                      <span className={`status-badge ${p.userId?.isActive !== false ? 'status-present' : 'status-absent'}`}>
                        {p.userId?.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{formatDate(p.createdAt)}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => openDetail(p)} title="View Details">
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

      {detailPartner && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDetailPartner(null); }}>
          <div className="modal glass-card" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3>Partner Details</h3>
              <button className="modal-close" onClick={() => setDetailPartner(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label className="text-muted" style={{ fontSize: '0.78rem' }}>Name</label>
                  <div style={{ fontWeight: 600 }}>{detailPartner.userId?.name}</div>
                </div>
                <div>
                  <label className="text-muted" style={{ fontSize: '0.78rem' }}>Email</label>
                  <div>{detailPartner.userId?.email}</div>
                </div>
                <div>
                  <label className="text-muted" style={{ fontSize: '0.78rem' }}>Referral Code</label>
                  <div style={{ fontWeight: 700, color: '#5b21b6' }}>{detailPartner.referralCode}</div>
                </div>
                <div>
                  <label className="text-muted" style={{ fontSize: '0.78rem' }}>Referral ID</label>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{detailPartner.referralId}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
                <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(3,55,122,0.05)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#03377A' }}>{detailPartner.totalReferred}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Referred</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(22,163,106,0.05)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#16a34a' }}>₹{detailPartner.totalEarnings}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Earned</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(3,55,122,0.05)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#03377A' }}>₹{detailPartner.availableBalance}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Available</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(100,116,139,0.05)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>₹{detailPartner.totalPaidOut}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Paid Out</div>
                </div>
              </div>

              <h4 style={{ marginBottom: '10px', fontSize: '0.9rem' }}>Recent Commissions</h4>
              {loadingCommissions ? (
                <div style={{ textAlign: 'center', padding: '20px' }}><div className="spinner" style={{ width: '24px', height: '24px' }}></div></div>
              ) : partnerCommissions.length === 0 ? (
                <p className="text-muted" style={{ textAlign: 'center', padding: '12px' }}>No commissions yet</p>
              ) : (
                <div className="table-container" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Fee</th>
                        <th>Commission</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partnerCommissions.map(c => (
                        <tr key={c._id}>
                          <td>
                            <div style={{ fontWeight: 500 }}>{c.studentName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.studentEmail}</div>
                          </td>
                          <td>₹{c.applicationFee}</td>
                          <td style={{ fontWeight: 700, color: '#16a34a' }}>₹{c.commissionAmount}</td>
                          <td>
                            <span className="status-badge" style={{
                              padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                              background: c.status === 'paid' ? '#dcfce7' : c.status === 'confirmed' ? '#dbeafe' : '#fef3c7',
                              color: c.status === 'paid' ? '#166534' : c.status === 'confirmed' ? '#1e40af' : '#92400e'
                            }}>
                              {c.status}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem' }}>{formatDate(c.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDetailPartner(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

export default ReferralPartnerManagement;
