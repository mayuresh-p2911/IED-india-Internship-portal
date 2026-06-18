import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import API from '../services/api';
import { formatDate, statusBadge } from '../utils/helpers';
import { Award, Plus, GraduationCap, Star, Heart, Download, Info, X } from 'lucide-react';

export function Certificates() {
  const { user, is } = useAuth();
  const { showToast } = useToast();

  const [certs, setCerts] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    internId: '',
    type: 'completion',
    performance: 'good',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: ''
  });

  const canGenerate = is('admin', 'hr');

  const fetchCerts = async () => {
    setLoading(true);
    try {
      const data = await API.get('/certificates');
      setCerts(data.certificates || []);
    } catch (err) {
      showToast(err.message || 'Failed to load certificates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchInterns = async () => {
    try {
      const data = await API.get('/users?role=intern');
      setInterns(data.users || []);
    } catch (err) {
      showToast(err.message || 'Failed to fetch interns', 'error');
    }
  };

  useEffect(() => {
    fetchCerts();
  }, []);

  const handleOpenModal = async () => {
    await fetchInterns();
    setFormData({
      internId: '',
      type: 'completion',
      performance: 'good',
      validFrom: new Date().toISOString().split('T')[0],
      validTo: ''
    });
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!formData.internId || !formData.type) {
      showToast('Intern and Certificate Type are required', 'error');
      return;
    }
    setLoading(true);
    try {
      await API.post('/certificates/generate', formData);
      showToast('Certificate generated successfully!', 'success');
      setModalOpen(false);
      fetchCerts();
    } catch (err) {
      showToast(err.message || 'Failed to generate certificate', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certId, name, type) => {
    showToast('Preparing certificate PDF...', 'info');
    try {
      const token = localStorage.getItem('ied_token') || '';
      const response = await fetch(`/api/certificates/${certId}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        let msg = 'Failed to download certificate. It may need to be regenerated.';
        try {
          const data = await response.json();
          msg = data.message || msg;
        } catch (e) {}
        throw new Error(msg);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const cleanName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
      link.setAttribute('download', `${cleanName}_${type}_certificate.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showToast(err.message || 'Download failed', 'error');
    }
  };

  const renderCertIcon = (type) => {
    switch (type) {
      case 'completion':
        return <GraduationCap size={22} color="white" />;
      case 'recommendation':
        return <Star size={22} color="white" />;
      case 'appreciation':
        return <Heart size={22} color="white" />;
      default:
        return <Award size={22} color="white" />;
    }
  };

  if (loading && certs.length === 0) {
    return (
      <div className="loading" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Certificates</h2>
          <p>{canGenerate ? 'Generate and manage internship certificates' : 'Your earned certificates'}</p>
        </div>
        {canGenerate && (
          <button className="btn btn-primary" onClick={handleOpenModal}>
            <Plus size={16} /> Generate Certificate
          </button>
        )}
      </div>

      {certs.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '20px' }}>
          {certs.map((c) => (
            <div
              key={c._id}
              className="cert-card"
              style={{
                padding: '20px',
                background: 'linear-gradient(135deg,rgba(26,35,126,0.5) 0%,rgba(13,71,161,0.4) 100%)',
                border: '1px solid rgba(79,142,247,0.3)',
                borderRadius: '16px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '2rem', opacity: 0.2 }}>
                <Award size={32} style={{ color: 'var(--accent-gold)' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'var(--grad-gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem'
                  }}
                >
                  {renderCertIcon(c.type)}
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--accent-gold)' }}>
                    {c.type.charAt(0).toUpperCase() + c.type.slice(1)} Certificate
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {c.certNo || ''}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '4px' }}>
                {c.internId?.name || '—'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                {c.internId?.department || ''}
              </div>
              {c.performance && (
                <div style={{ marginBottom: '8px' }}>
                  <span dangerouslySetInnerHTML={{ __html: statusBadge(c.performance) }} />
                </div>
              )}
              {c.validFrom && c.validTo && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  {formatDate(c.validFrom)} - {formatDate(c.validTo)}
                </div>
              )}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Issued: {formatDate(c.issuedDate)}
              </div>
              <button
                className="btn btn-primary btn-full"
                onClick={() => handleDownload(c._id, c.internId?.name || 'intern', c.type)}
              >
                <Download size={14} style={{ marginRight: '6px' }} /> Download PDF
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ padding: '60px' }}>
          <div className="empty-icon">
            <Award size={48} style={{ color: 'var(--text-muted)' }} />
          </div>
          <h3>No Certificates Yet</h3>
          <p>{is('intern') ? 'Complete your internship to earn a certificate!' : 'Generate certificates for completed interns'}</p>
          {canGenerate && (
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handleOpenModal}>
              <Award size={16} /> Generate First Certificate
            </button>
          )}
        </div>
      )}

      {/* Generate Certificate Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="modal glass-card">
            <div className="modal-header">
              <h3>Generate Certificate</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleGenerate}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label>Intern *</label>
                    <select name="internId" value={formData.internId} onChange={handleFormChange} required>
                      <option value="">Select intern</option>
                      {interns.map((i) => (
                        <option key={i._id} value={i._id}>
                          {i.name} ({i.department || ''})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Certificate Type *</label>
                      <select name="type" value={formData.type} onChange={handleFormChange} required>
                        <option value="completion">Completion Certificate</option>
                        <option value="recommendation">Letter of Recommendation</option>
                        <option value="appreciation">Appreciation Certificate</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Performance</label>
                      <select name="performance" value={formData.performance} onChange={handleFormChange}>
                        <option value="excellent">Excellent</option>
                        <option value="good">Good</option>
                        <option value="average">Average</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Valid From</label>
                      <input
                        type="date"
                        name="validFrom"
                        value={formData.validFrom}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Valid To</label>
                      <input
                        type="date"
                        name="validTo"
                        value={formData.validTo}
                        onChange={handleFormChange}
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      background: 'rgba(79,142,247,0.08)',
                      border: '1px solid rgba(79,142,247,0.2)',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '0.82rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <Info
                      size={14}
                      style={{ display: 'inline-block', marginRight: '4px', verticalAlign: 'middle' }}
                    />
                    A PDF certificate with QR code verification will be generated and saved.
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Award size={12} style={{ marginRight: '4px' }} /> Generate Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Certificates;
