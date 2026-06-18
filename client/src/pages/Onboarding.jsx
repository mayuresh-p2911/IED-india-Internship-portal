import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import API from '../services/api';
import {
  Edit3,
  X,
  FileCheck,
  FileSignature,
  IdCard,
  Users,
  Mail,
  Upload,
  RefreshCw,
  CreditCard,
  Camera,
  FileText
} from 'lucide-react';

export function Onboarding() {
  const { user, is } = useAuth();
  const { showToast } = useToast();

  const [records, setRecords] = useState([]);
  const [internRecord, setInternRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  // Admin Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    offerLetterSent: false,
    agreementUploaded: false,
    internIdGenerated: false,
    orientationDone: false,
    welcomeEmailSent: false,
    orientationDate: '',
    internshipId: '',
    notes: '',
    documents: {
      resume: '',
      aadhaar: '',
      collegeId: '',
      photo: ''
    }
  });

  const isIntern = is('intern');

  const progressPercent = (ob) => {
    if (!ob) return 0;
    const checks = ['offerLetterSent', 'agreementUploaded', 'internIdGenerated', 'orientationDone', 'welcomeEmailSent'];
    const done = checks.filter((k) => ob[k]).length;
    return Math.round((done / checks.length) * 100);
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      if (isIntern) {
        const res = await API.get('/onboarding/me');
        setInternRecord(res);
      } else {
        const res = await API.get('/onboarding');
        setRecords(res.onboarding || res || []);
      }
    } catch (err) {
      if (isIntern) {
        setInternRecord(null);
      } else {
        showToast(err.message || 'Failed to load onboarding records', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [isIntern]);

  const handleOpenChecklist = (ob) => {
    setSelectedRecord(ob);
    const orientDate = ob.orientationDate ? ob.orientationDate.slice(0, 10) : '';
    const docs = ob.documents || {};
    setFormData({
      offerLetterSent: !!ob.offerLetterSent,
      agreementUploaded: !!ob.agreementUploaded,
      internIdGenerated: !!ob.internIdGenerated,
      orientationDone: !!ob.orientationDone,
      welcomeEmailSent: !!ob.welcomeEmailSent,
      orientationDate: orientDate,
      internshipId: ob.internshipId || ob.internId?.internshipId || '',
      notes: ob.notes || '',
      documents: {
        resume: docs.resume || '',
        aadhaar: docs.aadhaar || '',
        collegeId: docs.collegeId || '',
        photo: docs.photo || ''
      }
    });
    setModalOpen(true);
  };

  const handleCheckboxChange = (name) => {
    setFormData((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDocStatusMark = (docName) => {
    setFormData((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        [docName]: 'uploaded'
      }
    }));
  };

  const handleSaveChecklist = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;

    const payload = {
      offerLetterSent: formData.offerLetterSent,
      agreementUploaded: formData.agreementUploaded,
      internIdGenerated: formData.internIdGenerated,
      orientationDone: formData.orientationDone,
      welcomeEmailSent: formData.welcomeEmailSent,
      orientationDate: formData.orientationDate || undefined,
      notes: formData.notes.trim(),
      documents: formData.documents
    };

    if (formData.internshipId.trim()) {
      payload.internshipId = formData.internshipId.trim();
    }

    try {
      await API.put(`/onboarding/${selectedRecord._id}`, payload);
      showToast('Onboarding checklist saved!', 'success');
      setModalOpen(false);
      fetchRecords();
    } catch (err) {
      showToast(err.message || 'Failed to save onboarding checklist', 'error');
    }
  };

  const handleUploadDoc = async (type, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    showToast(`Uploading ${type}…`, 'info');
    try {
      const fd = new FormData();
      fd.append('document', file);
      fd.append('type', type);
      await API.post('/onboarding/upload', fd);
      showToast('Document uploaded successfully!', 'success');
      fetchRecords();
    } catch (err) {
      showToast(err.message || 'Upload failed', 'error');
    }
  };

  if (loading) {
    return (
      <div className="loading" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER INTERN
  // ═══════════════════════════════════════════════════════════
  if (isIntern) {
    if (!internRecord) {
      return (
        <div className="empty-state">
          <div className="empty-icon"><FileText size={48} color="var(--text-muted)" /></div>
          <p>No onboarding record found. Please contact HR.</p>
        </div>
      );
    }

    const pct = progressPercent(internRecord);
    const circumference = 251.2;
    const offset = circumference - (pct / 100) * circumference;
    const docs = internRecord.documents || {};
    const items = [
      { key: 'offerLetterSent', label: 'Offer Letter Sent', icon: FileCheck },
      { key: 'agreementUploaded', label: 'Agreement Uploaded', icon: FileSignature },
      { key: 'internIdGenerated', label: 'Intern ID Generated', icon: IdCard },
      { key: 'orientationDone', label: 'Orientation Done', icon: Users },
      { key: 'welcomeEmailSent', label: 'Welcome Email Sent', icon: Mail }
    ];

    const docItems = [
      { key: 'resume', label: 'Resume', icon: FileText },
      { key: 'aadhaar', label: 'Aadhaar Card', icon: CreditCard },
      { key: 'collegeId', label: 'College ID', icon: IdCard },
      { key: 'photo', label: 'Profile Photo', icon: Camera }
    ];

    return (
      <>
        <div className="page-header">
          <h1 className="page-title">My Onboarding</h1>
        </div>

        <div className="form-row" style={{ gap: '1.5rem', alignItems: 'flex-start' }}>
          {/* Progress Ring */}
          <div className="glass-card" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '140px', height: '140px', marginBottom: '1.5rem' }}>
              <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
                <circle
                  cx="70"
                  cy="70"
                  r="60"
                  fill="none"
                  stroke={pct === 100 ? '#00e676' : '#4f8ef7'}
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  style={{ transition: 'stroke-dashoffset .6s' }}
                />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>{pct}%</div>
                <div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>complete</div>
              </div>
            </div>
            {(internRecord.internshipId || internRecord.internId?.internshipId) && (
              <div
                style={{
                  background: 'rgba(79,142,247,0.15)',
                  border: '1px solid rgba(79,142,247,0.3)',
                  borderRadius: '8px',
                  padding: '.75rem 1.5rem',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginBottom: '.2rem' }}>Your Intern ID</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#4f8ef7', letterSpacing: '.1em' }}>
                  {internRecord.internshipId || internRecord.internId?.internshipId}
                </div>
              </div>
            )}
          </div>

          {/* Checklist */}
          <div className="glass-card" style={{ flex: 2, padding: '1.5rem' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Onboarding Checklist</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {items.map((item) => {
                const Icon = item.icon;
                const isDone = internRecord[item.key];
                return (
                  <div
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '.75rem',
                      padding: '.75rem',
                      background: 'rgba(255,255,255,0.03)',
                      borderParagraph: '8px',
                      borderRadius: '8px',
                      borderLeft: `3px solid ${isDone ? '#00e676' : 'rgba(255,255,255,0.1)'}`
                    }}
                  >
                    <div style={{ color: isDone ? '#00e676' : 'var(--text-muted)' }}>
                      <Icon size={18} />
                    </div>
                    <span style={{ color: isDone ? 'var(--text-primary)' : 'var(--text-muted)' }}>{item.label}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '.75rem', color: isDone ? '#00e676' : 'var(--text-muted)' }}>
                      {isDone ? 'Done' : 'Pending'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Document Uploads */}
        <div className="glass-card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Document Uploads</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '1rem' }}>
            {docItems.map((item) => {
              const Icon = item.icon;
              const isUploaded = !!docs[item.key];
              return (
                <div key={item.key} style={{ padding: '1rem', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', textAlign: 'center' }}>
                  <Icon size={32} style={{ color: isUploaded ? '#00e676' : 'var(--text-muted)', marginBottom: '.5rem' }} />
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '.25rem' }}>{item.label}</div>
                  <div style={{ fontSize: '.75rem', color: isUploaded ? '#00e676' : '#ff9100', marginBottom: '.75rem' }}>
                    {isUploaded ? '✓ Uploaded' : 'Not uploaded'}
                  </div>
                  <label className={`btn btn-sm ${isUploaded ? 'btn-secondary' : 'btn-primary'}`} style={{ cursor: 'pointer' }}>
                    {isUploaded ? <RefreshCw size={12} style={{ marginRight: '4px' }} /> : <Upload size={12} style={{ marginRight: '4px' }} />}
                    <span>{isUploaded ? 'Replace' : 'Upload'}</span>
                    <input type="file" style={{ display: 'none' }} onChange={(e) => handleUploadDoc(item.key, e)} />
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {internRecord.notes && (
          <div className="glass-card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '.75rem' }}>Notes from HR</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{internRecord.notes}</p>
          </div>
        )}
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER ADMIN / HR
  // ═══════════════════════════════════════════════════════════
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Onboarding</h1>
      </div>

      <div id="ob-list">
        {!records.length ? (
          <div className="empty-state">
            <div className="empty-icon"><Users size={48} color="var(--text-muted)" /></div>
            <p>No onboarding records found</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '1rem' }}>
            {records.map((ob) => {
              const pct = progressPercent(ob);
              const color = pct === 100 ? '#00e676' : pct >= 50 ? '#ffd700' : '#ff9100';
              const intern = ob.internId || {};
              return (
                <div className="glass-card" style={{ padding: '1.25rem' }} key={ob._id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg,#4f8ef7,#7c4dff)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 700,
                        flexShrink: 0
                      }}
                    >
                      {(intern.name || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{intern.name || 'Unknown'}</div>
                      <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{intern.department || ''}</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color }}>{pct}%</div>
                  </div>
                  <div className="progress-bar" style={{ marginBottom: '.5rem' }}>
                    <div className="progress-fill" style={{ width: `${pct}%`, backgroundColor: color }}></div>
                  </div>
                  <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '.75rem' }}>
                    {ob.offerLetterSent && <span className="status-badge status-active" style={{ fontSize: '.65rem' }}>Offer Sent</span>}
                    {ob.agreementUploaded && <span className="status-badge status-active" style={{ fontSize: '.65rem' }}>Agreement</span>}
                    {ob.internIdGenerated && <span className="status-badge status-active" style={{ fontSize: '.65rem' }}>ID Generated</span>}
                    {ob.orientationDone && <span className="status-badge status-active" style={{ fontSize: '.65rem' }}>Orientation</span>}
                    {ob.welcomeEmailSent && <span className="status-badge status-active" style={{ fontSize: '.65rem' }}>Welcome Email</span>}
                  </div>
                  <button className="btn btn-sm btn-primary open-ob-btn" onClick={() => handleOpenChecklist(ob)} style={{ width: '100%' }}>
                    <Edit3 size={12} style={{ marginRight: '4px' }} /> Manage Checklist
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Checklist Management Modal */}
      {modalOpen && selectedRecord && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="modal glass-card">
            <div className="modal-header">
              <h3>Onboarding: {selectedRecord.internId?.name || 'Intern'}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveChecklist}>
              <div className="modal-body">
                <div className="form-section">
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '.75rem' }}>Checklist Items</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                    {[
                      { key: 'offerLetterSent', label: 'Offer Letter Sent' },
                      { key: 'agreementUploaded', label: 'Agreement Uploaded' },
                      { key: 'internIdGenerated', label: 'Intern ID Generated' },
                      { key: 'orientationDone', label: 'Orientation Done' },
                      { key: 'welcomeEmailSent', label: 'Welcome Email Sent' }
                    ].map((item) => {
                      const isChecked = formData[item.key];
                      return (
                        <label
                          key={item.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '.6rem 1rem',
                            background: 'rgba(255,255,255,0.04)',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                        >
                          <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                          <div className="toggle-wrap" style={{ position: 'relative', width: '44px', height: '22px' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleCheckboxChange(item.key)}
                              style={{
                                opacity: 0,
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                cursor: 'pointer',
                                zIndex: 2,
                                margin: 0
                              }}
                            />
                            <div
                              className="toggle-track"
                              style={{
                                position: 'absolute',
                                inset: 0,
                                borderRadius: '11px',
                                background: isChecked ? '#00e676' : 'rgba(255,255,255,0.12)',
                                transition: 'background .2s'
                              }}
                            ></div>
                            <div
                              style={{
                                position: 'absolute',
                                top: '2px',
                                left: isChecked ? '22px' : '2px',
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                background: '#fff',
                                transition: 'left .2s'
                              }}
                            ></div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <h4 style={{ color: 'var(--text-primary)', margin: '.75rem 0' }}>Document Upload Status</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                    {[
                      { key: 'resume', label: 'Resume' },
                      { key: 'aadhaar', label: 'Aadhaar' },
                      { key: 'collegeId', label: 'College ID' },
                      { key: 'photo', label: 'Photo' }
                    ].map((doc) => {
                      const isUploaded = formData.documents[doc.key] === 'uploaded';
                      return (
                        <div style={{ padding: '.6rem', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }} key={doc.key}>
                          <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '.3rem' }}>{doc.label}</div>
                          <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between' }}>
                            <span style={{ color: isUploaded ? '#00e676' : '#ff9100', fontSize: '.8rem' }}>
                              {isUploaded ? '✓ Uploaded' : '✗ Missing'}
                            </span>
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost"
                              title="Mark uploaded"
                              onClick={() => handleDocStatusMark(doc.key)}
                            >
                              <Upload size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="form-row" style={{ marginTop: '.75rem' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Orientation Date</label>
                      <input
                        type="date"
                        name="orientationDate"
                        className="form-control"
                        value={formData.orientationDate}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Intern ID</label>
                      <input
                        type="text"
                        name="internshipId"
                        className="form-control"
                        value={formData.internshipId}
                        onChange={handleFormChange}
                        placeholder="IED-2024-001"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Notes</label>
                    <textarea
                      name="notes"
                      className="form-control"
                      rows="3"
                      value={formData.notes}
                      onChange={handleFormChange}
                      placeholder="Additional notes…"
                    ></textarea>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Checklist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Onboarding;
