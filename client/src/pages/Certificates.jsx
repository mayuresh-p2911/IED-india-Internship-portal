import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import API from '../services/api';
import { formatDate, statusBadge } from '../utils/helpers';
import { downloadCertificateImage } from '../utils/certificateGenerator';
import { Award, Plus, GraduationCap, Star, Heart, Download, Info, X, Eye, FileText, Sparkles, RefreshCw } from 'lucide-react';

export function Certificates() {
  const { user, is } = useAuth();
  const { showToast } = useToast();

  const [certs, setCerts] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Admin Generate Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    internId: '',
    type: 'completion',
    performance: 'good',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: ''
  });

  // Preview Modal State
  const [previewCert, setPreviewCert] = useState(null);

  const canGenerate = is('admin', 'hr', 'superadmin');

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

  // Intern self-generation
  const handleGenerateSelf = async () => {
    setGenerating(true);
    showToast('Generating your official IED India Certificate...', 'info');
    try {
      await API.post('/certificates/generate', {
        internId: user?._id,
        type: 'completion',
        performance: 'good'
      });
      showToast('Certificate generated successfully!', 'success');
      await fetchCerts();
    } catch (err) {
      showToast(err.message || 'Failed to generate certificate', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Admin generation
  const handleAdminGenerate = async (e) => {
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
      await fetchCerts();
    } catch (err) {
      showToast(err.message || 'Failed to generate certificate', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Download exact image (JPG)
  const handleDownloadImg = async (internName) => {
    try {
      showToast('Preparing high-resolution certificate image...', 'info');
      await downloadCertificateImage(internName || user?.name || 'Intern');
      showToast('Certificate image downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to download certificate image', 'error');
    }
  };

  // Download PDF
  const handleDownloadPdf = async (certId, name, type) => {
    showToast('Preparing official certificate PDF...', 'info');
    try {
      const token = localStorage.getItem('ied_token') || '';
      const response = await fetch(`/api/certificates/${certId}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        let msg = 'Failed to download certificate.';
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

      const cleanName = (name || 'Intern').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.setAttribute('download', `${cleanName}_Internship_Certificate.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('Certificate PDF downloaded!', 'success');
    } catch (err) {
      showToast(err.message || 'Download failed', 'error');
    }
  };

  const renderCertIcon = (type) => {
    switch (type) {
      case 'completion':
        return <GraduationCap size={20} color="white" />;
      case 'recommendation':
        return <Star size={20} color="white" />;
      case 'appreciation':
        return <Heart size={20} color="white" />;
      default:
        return <Award size={20} color="white" />;
    }
  };

  if (loading && certs.length === 0) {
    return (
      <div className="loading" style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2>Certificates</h2>
          <p>{is('intern') ? 'Your verified IED India internship certificate' : 'Generate and manage internship certificates'}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {is('intern') && (
            <button
              className="btn btn-primary"
              onClick={handleGenerateSelf}
              disabled={generating}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {generating ? <RefreshCw size={16} className="spin" /> : <Sparkles size={16} />}
              {certs.length ? 'Regenerate Certificate' : 'Generate My Certificate'}
            </button>
          )}
          {canGenerate && (
            <button className="btn btn-primary" onClick={handleOpenModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} /> Generate Certificate
            </button>
          )}
        </div>
      </div>

      {certs.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
          {certs.map((c) => {
            const internName = c.internId?.name || user?.name || 'Intern';
            const certCode = c.certNo || c.certificateNo || 'IEDIN/INT/2026/01245';

            return (
              <div
                key={c._id}
                className="cert-card glass-card"
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Header info */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #092d76 0%, #1565c0 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {renderCertIcon(c.type)}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#092d76' }}>
                        Certificate of Internship
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {certCode}
                      </div>
                    </div>
                  </div>
                  {c.performance && (
                    <span dangerouslySetInnerHTML={{ __html: statusBadge(c.performance) }} />
                  )}
                </div>

                {/* Pixel-perfect live certificate preview thumbnail */}
                <div
                  onClick={() => setPreviewCert(c)}
                  style={{
                    position: 'relative',
                    width: '100%',
                    paddingTop: '66.6%', /* 682 / 1024 */
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1px solid rgba(9, 45, 118, 0.2)',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                    cursor: 'pointer',
                    background: '#f8fafc'
                  }}
                  title="Click to preview fullscreen"
                >
                  <img
                    src="/img/certificate_clean_base.jpg"
                    alt="Certificate Template"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  {/* Name overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '43.2%',
                      left: '26.6%',
                      width: '48%',
                      textAlign: 'center',
                      fontFamily: "'Alex Brush', cursive",
                      fontSize: 'clamp(1rem, 2.8vw, 1.8rem)',
                      color: '#092d76',
                      lineHeight: 1,
                      pointerEvents: 'none',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {internName}
                  </div>
                  {/* Hover badge */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      background: 'rgba(9, 45, 118, 0.85)',
                      color: '#fff',
                      fontSize: '0.7rem',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Eye size={12} /> Click to Preview
                  </div>
                </div>

                {/* Metadata */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <div>
                    <strong>Recipient:</strong> {internName}
                  </div>
                  <div>
                    <strong>Issued:</strong> {formatDate(c.issuedDate)}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.82rem' }}
                    onClick={() => handleDownloadImg(internName)}
                  >
                    <Download size={14} /> Download Image
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.82rem' }}
                    onClick={() => handleDownloadPdf(c._id, internName, c.type)}
                  >
                    <FileText size={14} /> Download PDF
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="glass-card"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            maxWidth: '680px',
            margin: '40px auto'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #092d76 0%, #1565c0 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: '#ffffff'
            }}
          >
            <Award size={32} />
          </div>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
            {is('intern') ? 'Official Internship Certificate' : 'No Certificates Yet'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '24px', lineHeight: 1.5 }}>
            {is('intern')
              ? 'Congratulations! You are eligible to generate and download your verified IED India internship certificate with official accreditation and QR code verification.'
              : 'Generate and issue official certificates to interns upon internship completion.'}
          </p>

          {is('intern') ? (
            <button
              className="btn btn-primary btn-lg"
              onClick={handleGenerateSelf}
              disabled={generating}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', fontSize: '1rem' }}
            >
              {generating ? <RefreshCw size={18} className="spin" /> : <Sparkles size={18} />}
              {generating ? 'Generating Certificate...' : 'Generate My Certificate'}
            </button>
          ) : canGenerate ? (
            <button className="btn btn-primary" onClick={handleOpenModal} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} /> Generate First Certificate
            </button>
          ) : null}
        </div>
      )}

      {/* Fullscreen Certificate Preview Modal */}
      {previewCert && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setPreviewCert(null); }}
          style={{ background: 'rgba(0, 0, 0, 0.8)', zIndex: 9999 }}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: '920px',
              width: '94%',
              borderRadius: '16px',
              overflow: 'hidden',
              background: '#ffffff',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={20} color="#092d76" />
                <span style={{ fontWeight: '700', fontSize: '1rem', color: '#092d76' }}>
                  Certificate Preview — {previewCert.internId?.name || user?.name}
                </span>
              </div>
              <button
                className="modal-close"
                onClick={() => setPreviewCert(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} color="#64748b" />
              </button>
            </div>

            <div style={{ padding: '20px', overflowX: 'auto', textAlign: 'center' }}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '850px',
                  margin: '0 auto',
                  paddingTop: '66.6%',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  border: '1px solid #cbd5e1'
                }}
              >
                <img
                  src="/img/certificate_clean_base.jpg"
                  alt="Official IED India Certificate"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '43.2%',
                    left: '26.6%',
                    width: '48%',
                    textAlign: 'center',
                    fontFamily: "'Alex Brush', cursive",
                    fontSize: 'clamp(1.5rem, 4vw, 3rem)',
                    color: '#092d76',
                    lineHeight: 1,
                    pointerEvents: 'none',
                    userSelect: 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {previewCert.internId?.name || user?.name || 'Intern Name'}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 20px',
                borderTop: '1px solid #e2e8f0',
                background: '#f8fafc'
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => setPreviewCert(null)}
              >
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleDownloadImg(previewCert.internId?.name || user?.name)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={15} /> Download Image (JPG)
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleDownloadPdf(previewCert._id, previewCert.internId?.name || user?.name, previewCert.type)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FileText size={15} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Generate Certificate Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="modal glass-card">
            <div className="modal-header">
              <h3>Generate Certificate</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAdminGenerate}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label>Intern *</label>
                    <select name="internId" value={formData.internId} onChange={handleFormChange} required>
                      <option value="">Select intern</option>
                      {interns.map((i) => (
                        <option key={i._id} value={i._id}>
                          {i.name} ({i.department || 'No dept'})
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
                      background: 'rgba(9, 45, 118, 0.06)',
                      border: '1px solid rgba(9, 45, 118, 0.15)',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '0.82rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <Info
                      size={14}
                      style={{ display: 'inline-block', marginRight: '4px', verticalAlign: 'middle', color: '#092d76' }}
                    />
                    Generates the official IED India certificate with recipient's name in calligraphy and verification QR code.
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Award size={14} style={{ marginRight: '4px' }} /> Generate Certificate
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
