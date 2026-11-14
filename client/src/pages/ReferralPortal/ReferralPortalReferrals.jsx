import { useState, useEffect } from 'react';
import { useToast } from '../../components/Toast';
import API from '../../services/api';
import { Users, Search, Calendar, Briefcase, CheckCircle, Clock, XCircle } from 'lucide-react';

const STATUS_COLORS = {
  pending: { bg: '#fff7ed', color: '#ea580c', label: 'Pending' },
  shortlisted: { bg: '#dbeafe', color: '#2563eb', label: 'Shortlisted' },
  selected: { bg: '#dcfce7', color: '#16a34a', label: 'Selected' },
  rejected: { bg: '#fee2e2', color: '#dc2626', label: 'Rejected' },
  interview_scheduled: { bg: '#f3e8ff', color: '#7c3aed', label: 'Interview' },
  on_hold: { bg: '#fef3c7', color: '#d97706', label: 'On Hold' },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: '#f1f5f9', color: '#64748b', label: status };
  return (
    <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

export function ReferralPortalReferrals() {
  const { showToast } = useToast();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchReferrals(); }, []);

  const fetchReferrals = async () => {
    try {
      const data = await API.get('/referral-partners/referrals');
      setReferrals(data.referrals || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load referrals', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filtered = referrals.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.name || '').toLowerCase().includes(q) ||
           (r.email || '').toLowerCase().includes(q) ||
           (r.department || '').toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#0f172a' }}>My Referrals</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Students who applied using your referral code
          </p>
        </div>
        <div style={{ position: 'relative', minWidth: '220px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by name, email, dept..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 8px 8px 32px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div className="glass-card" style={{ padding: '14px', textAlign: 'center' }}>
          <Users size={18} style={{ color: '#03377A', marginBottom: '4px' }} />
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{referrals.length}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Referred</div>
        </div>
        <div className="glass-card" style={{ padding: '14px', textAlign: 'center' }}>
          <CheckCircle size={18} style={{ color: '#16a34a', marginBottom: '4px' }} />
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{referrals.filter(r => r.status === 'selected').length}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Selected</div>
        </div>
        <div className="glass-card" style={{ padding: '14px', textAlign: 'center' }}>
          <Clock size={18} style={{ color: '#ea580c', marginBottom: '4px' }} />
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{referrals.filter(r => r.status === 'pending').length}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Pending</div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <Users size={32} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
          <p style={{ color: '#94a3b8', margin: 0 }}>
            {search ? 'No referrals match your search.' : 'No referrals yet. Share your referral code to get started!'}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Department</th>
                <th>Applied On</th>
                <th>Status</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r._id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{r.email}</div>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                      <Briefcase size={13} style={{ color: '#64748b' }} /> {r.department || '—'}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#64748b' }}>
                      <Calendar size={13} /> {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </span>
                  </td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>
                    {r.payment?.status === 'paid' ? (
                      <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.85rem' }}>₹{r.payment.amount} Paid</span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ReferralPortalReferrals;
