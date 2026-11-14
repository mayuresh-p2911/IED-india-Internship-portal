import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import API from '../services/api';
import { Settings, Plus, Pencil, ChevronDown, ChevronUp, X, Check, History } from 'lucide-react';

const DEPARTMENTS = [
  { value: '', label: 'Default (All Departments)' },
  { value: 'Digital Marketing', label: 'Digital Marketing' },
  { value: 'HR & Recruitment', label: 'HR & Recruitment' },
  { value: 'Business Development', label: 'Business Development' },
  { value: 'Social Media', label: 'Social Media' },
  { value: 'Entrepreneurship Training', label: 'Entrepreneurship Training' },
  { value: 'IT Support', label: 'IT Support' },
];

export function PricingManagement() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  const [form, setForm] = useState({
    department: '',
    applicationFee: '',
    commissionPercent: '',
    reason: ''
  });
  const [editingConfig, setEditingConfig] = useState(null);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await API.get('/pricing/admin');
      setConfigs(res.configs || []);
    } catch (err) {
      showToast(err.message || 'Failed to load pricing configs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfigs(); }, []);

  const openAddModal = () => {
    setEditingConfig(null);
    setForm({ department: '', applicationFee: '', commissionPercent: '10', reason: '' });
    setModalOpen(true);
  };

  const openEditModal = (config) => {
    setEditingConfig(config);
    setForm({
      department: config.department || '',
      applicationFee: String(config.applicationFee),
      commissionPercent: String(config.commissionPercent),
      reason: ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        department: form.department || null,
        applicationFee: Number(form.applicationFee),
        commissionPercent: Number(form.commissionPercent),
        reason: form.reason
      };
      await API.put('/pricing', body);
      showToast('Pricing configuration saved successfully', 'success');
      setModalOpen(false);
      fetchConfigs();
    } catch (err) {
      showToast(err.message || 'Failed to save pricing config', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

  if (loading) {
    return (
      <div className="loading" style={{ height: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={22} /> Pricing & Fee Configuration
          </h2>
          <p className="text-muted" style={{ margin: '4px 0 0' }}>Manage application fees and referral commission percentages</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} style={{ marginRight: '4px' }} /> Add Pricing
        </button>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Application Fee</th>
                <th>Commission %</th>
                <th>Last Updated</th>
                <th>Updated By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {configs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No pricing configurations yet. Click "Add Pricing" to create one.
                  </td>
                </tr>
              ) : (
                configs.map((c) => (
                  <tr key={c._id} style={{ cursor: 'default' }}>
                    <td>
                      <strong>{c.department || 'Default (All)'}</strong>
                    </td>
                    <td style={{ fontWeight: 700, color: '#03377A' }}>₹{c.applicationFee}</td>
                    <td>{c.commissionPercent}%</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{formatDate(c.updatedAt)}</td>
                    <td style={{ fontSize: '0.85rem' }}>{c.updatedBy?.name || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(c)} title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setExpandedRow(expandedRow === c._id ? null : c._id)}
                          title="Change History"
                        >
                          <History size={14} />
                          {expandedRow === c._id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      </div>
                      {expandedRow === c._id && c.changeHistory && c.changeHistory.length > 0 && (
                        <div style={{ position: 'absolute', right: '16px', marginTop: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px', zIndex: 10, minWidth: '340px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
                          <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem' }}>Change History</h4>
                          {c.changeHistory.slice().reverse().map((h, idx) => (
                            <div key={idx} style={{ borderBottom: idx < c.changeHistory.length - 1 ? '1px solid var(--border-color)' : 'none', padding: '8px 0', fontSize: '0.82rem' }}>
                              <div style={{ color: 'var(--text-secondary)' }}>
                                Fee: ₹{h.previousFee} → ₹{h.newFee} | Commission: {h.previousCommission}% → {h.newCommission}%
                              </div>
                              <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                                {h.changedBy?.name || 'Admin'} · {formatDate(h.changedAt)}
                                {h.reason && <span> · {h.reason}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="modal glass-card">
            <div className="modal-header">
              <h3>{editingConfig ? 'Edit Pricing' : 'Add Pricing Configuration'}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label>Department</label>
                    <select
                      value={form.department}
                      onChange={(e) => setForm(f => ({ ...f, department: e.target.value }))}
                      disabled={!!editingConfig}
                    >
                      {DEPARTMENTS.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                    {editingConfig && (
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Department cannot be changed when editing</small>
                    )}
                  </div>
                  <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Application Fee (₹) *</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={form.applicationFee}
                        onChange={(e) => setForm(f => ({ ...f, applicationFee: e.target.value }))}
                        placeholder="e.g. 999"
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Commission % *</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        required
                        value={form.commissionPercent}
                        onChange={(e) => setForm(f => ({ ...f, commissionPercent: e.target.value }))}
                        placeholder="e.g. 10"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Reason for Change</label>
                    <textarea
                      rows="2"
                      value={form.reason}
                      onChange={(e) => setForm(f => ({ ...f, reason: e.target.value }))}
                      placeholder="Optional: why this change is being made"
                    ></textarea>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div>
                  ) : (
                    <><Check size={14} style={{ marginRight: '4px' }} /> Save Configuration</>
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

export default PricingManagement;
