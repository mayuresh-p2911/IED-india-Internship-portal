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
  FileText,
  ExternalLink,
  Download
} from 'lucide-react';

export const getDocDetails = (docs, key) => {
  if (!docs) return { uploaded: false, path: '' };
  const val = docs[key];
  if (!val) return { uploaded: false, path: '' };
  if (typeof val === 'string') {
    if (val === 'uploaded') return { uploaded: true, path: '' };
    return { uploaded: true, path: val };
  }
  if (typeof val === 'object') {
    return {
      uploaded: Boolean(val.uploaded || val.path),
      path: val.path || ''
    };
  }
  return { uploaded: Boolean(val), path: '' };
};

export function Onboarding() {
  const { is } = useAuth();
  const { showToast } = useToast();

  const [records, setRecords] = useState([]);
  const [internRecord, setInternRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState(null);

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
      resume: { uploaded: false, path: '' },
      aadhaar: { uploaded: false, path: '' },
      collegeId: { uploaded: false, path: '' },
      photo: { uploaded: false, path: '' }
    }
  });

  const isIntern = is('intern');

  const docItems = [
    { key: 'resume', label: 'Resume', icon: FileText },
    { key: 'aadhaar', label: 'Aadhaar Card', icon: CreditCard },
    { key: 'collegeId', label: 'College ID', icon: IdCard },
    { key: 'photo', label: 'Profile Photo', icon: Camera }
  ];

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
        setInternRecord(res.record || res || null);
      } else {
        const res = await API.get('/onboarding');
        const list = res.records || res.onboarding || (Array.isArray(res) ? res : []);
        setRecords(list);
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
        resume: docs.resume || { uploaded: false, path: '' },
        aadhaar: docs.aadhaar || { uploaded: false, path: '' },
        collegeId: docs.collegeId || { uploaded: false, path: '' },
        photo: docs.photo || { uploaded: false, path: '' }
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
      await fetchRecords();
    } catch (err) {
      showToast(err.message || 'Failed to save onboarding checklist', 'error');
    }
  };

  // Intern Upload Handler
  const handleUploadDoc = async (type, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const typeLabel = docItems.find((d) => d.key === type)?.label || type;
    setUploadingDoc(type);
    showToast(`Uploading ${typeLabel}…`, 'info');

    try {
      const fd = new FormData();
      fd.append('document', file);
      fd.append('type', type);
      await API.upload('/onboarding/upload', fd);
      showToast(`${typeLabel} uploaded successfully!`, 'success');
      await fetchRecords();
    } catch (err) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setUploadingDoc(null);
      e.target.value = '';
    }
  };

  // Admin Upload Handler (upload on behalf of an intern)
  const handleAdminUploadDoc = async (type, internId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const typeLabel = docItems.find((d) => d.key === type)?.label || type;
    setUploadingDoc(type);
    showToast(`Uploading ${typeLabel}…`, 'info');

    try {
      const fd = new FormData();
      fd.append('document', file);
      fd.append('type', type);
      if (internId) {
        fd.append('internId', internId);
      }
      const res = await API.upload('/onboarding/upload', fd);
      showToast(`${typeLabel} uploaded successfully!`, 'success');

      if (res.record) {
        setSelectedRecord(res.record);
        const docs = res.record.documents || {};
        setFormData((prev) => ({
          ...prev,
          documents: {
            ...prev.documents,
            [type]: docs[type] || { uploaded: true, path: res.filePath }
          }
        }));
      }
      await fetchRecords();
    } catch (err) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setUploadingDoc(null);
      e.target.value = '';
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
  // RENDER INTERN VIEW
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Document Uploads</h3>
            <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>Supported formats: PDF, DOC, DOCX, PNG, JPG (Max 10MB)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '1rem' }}>
            {docItems.map((item) => {
              const Icon = item.icon;
              const docInfo = getDocDetails(docs, item.key);
              const isBusy = uploadingDoc === item.key;
              const isImage = item.key === 'photo' || (docInfo.path && /\.(jpg|jpeg|png|webp)$/i.test(docInfo.path));

              return (
                <div
                  key={item.key}
                  style={{
                    padding: '1.25rem',
                    background: docInfo.uploaded ? 'rgba(0,230,118,0.04)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${docInfo.uploaded ? 'rgba(0,230,118,0.25)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '10px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    transition: 'all .2s ease'
                  }}
                >
                  {isImage && docInfo.path ? (
                    <img
                      src={docInfo.path}
                      alt={item.label}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        marginBottom: '.5rem',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    />
                  ) : (
                    <Icon size={32} style={{ color: docInfo.uploaded ? '#00e676' : 'var(--text-muted)', marginBottom: '.5rem' }} />
                  )}

                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.25rem' }}>{item.label}</div>
                  <div style={{ fontSize: '.75rem', fontWeight: 500, color: docInfo.uploaded ? '#00e676' : '#ff9100', marginBottom: '.75rem' }}>
                    {docInfo.uploaded ? '✓ Uploaded' : 'Not uploaded'}
                  </div>

                  <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {docInfo.uploaded && docInfo.path && (
                      <a
                        href={docInfo.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-ghost"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                      >
                        <ExternalLink size={13} /> View
                      </a>
                    )}

                    <label
                      className={`btn btn-sm ${docInfo.uploaded ? 'btn-secondary' : 'btn-primary'}`}
                      style={{
                        cursor: isBusy ? 'wait' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        opacity: isBusy ? 0.7 : 1
                      }}
                    >
                      {isBusy ? (
                        <>
                          <RefreshCw size={13} className="spin" />
                          <span>Uploading…</span>
                        </>
                      ) : (
                        <>
                          {docInfo.uploaded ? <RefreshCw size={13} /> : <Upload size={13} />}
                          <span>{docInfo.uploaded ? 'Replace' : 'Upload'}</span>
                        </>
                      )}
                      <input
                        type="file"
                        disabled={isBusy}
                        accept={item.key === 'photo' ? 'image/*' : '.pdf,.doc,.docx,.png,.jpg,.jpeg'}
                        style={{ display: 'none' }}
                        onChange={(e) => handleUploadDoc(item.key, e)}
                      />
                    </label>
                  </div>
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
  // RENDER ADMIN / SUPER ADMIN / HR VIEW
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: '1.25rem' }}>
            {records.map((ob) => {
              const pct = progressPercent(ob);
              const color = pct === 100 ? '#00e676' : pct >= 50 ? '#ffd700' : '#ff9100';
              const intern = ob.internId || {};
              const docs = ob.documents || {};
              const uploadedDocsList = docItems.filter((d) => getDocDetails(docs, d.key).uploaded);
              const uploadedCount = uploadedDocsList.length;

              return (
                <div className="glass-card" style={{ padding: '1.25rem' }} key={ob._id}>
                  {/* Intern header */}
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
                      <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                        {intern.department ? `${intern.department} • ` : ''}
                        {intern.email || ''}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color }}>{pct}%</div>
                  </div>

                  {/* Progress bar */}
                  <div className="progress-bar" style={{ marginBottom: '.5rem' }}>
                    <div className="progress-fill" style={{ width: `${pct}%`, backgroundColor: color }}></div>
                  </div>

                  {/* Checklist badges */}
                  <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '.75rem' }}>
                    {ob.offerLetterSent && <span className="status-badge status-active" style={{ fontSize: '.65rem' }}>Offer Sent</span>}
                    {ob.agreementUploaded && <span className="status-badge status-active" style={{ fontSize: '.65rem' }}>Agreement</span>}
                    {ob.internIdGenerated && <span className="status-badge status-active" style={{ fontSize: '.65rem' }}>ID Generated</span>}
                    {ob.orientationDone && <span className="status-badge status-active" style={{ fontSize: '.65rem' }}>Orientation</span>}
                    {ob.welcomeEmailSent && <span className="status-badge status-active" style={{ fontSize: '.65rem' }}>Welcome Email</span>}
                  </div>

                  {/* Uploaded Documents Section */}
                  <div style={{ marginTop: '.75rem', paddingTop: '.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                      <span style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Uploaded Documents</span>
                      <span
                        style={{
                          fontSize: '.7rem',
                          fontWeight: 600,
                          color: uploadedCount === 4 ? '#00e676' : uploadedCount > 0 ? '#4f8ef7' : '#ff9100'
                        }}
                      >
                        {uploadedCount}/4 Uploaded
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.4rem', marginBottom: '.85rem' }}>
                      {docItems.map((item) => {
                        const doc = getDocDetails(docs, item.key);
                        return (
                          <div
                            key={item.key}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '.4rem .55rem',
                              borderRadius: '6px',
                              background: doc.uploaded ? 'rgba(0,230,118,0.08)' : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${doc.uploaded ? 'rgba(0,230,118,0.25)' : 'rgba(255,255,255,0.06)'}`,
                              fontSize: '.72rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem', minWidth: 0, overflow: 'hidden' }}>
                              <item.icon size={13} style={{ color: doc.uploaded ? '#00e676' : 'var(--text-muted)', flexShrink: 0 }} />
                              <span
                                style={{
                                  color: doc.uploaded ? 'var(--text-primary)' : 'var(--text-muted)',
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {item.label}
                              </span>
                            </div>
                            {doc.uploaded && doc.path ? (
                              <a
                                href={doc.path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-xs btn-ghost"
                                style={{
                                  padding: '2px 5px',
                                  fontSize: '.68rem',
                                  color: '#4f8ef7',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  textDecoration: 'none',
                                  flexShrink: 0
                                }}
                                title={`View ${item.label}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink size={11} /> View
                              </a>
                            ) : (
                              <span style={{ fontSize: '.65rem', color: '#ff9100', flexShrink: 0 }}>Missing</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button className="btn btn-sm btn-primary open-ob-btn" onClick={() => handleOpenChecklist(ob)} style={{ width: '100%' }}>
                    <Edit3 size={12} style={{ marginRight: '4px' }} /> Manage Checklist & Documents
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Checklist & Document Management Modal */}
      {modalOpen && selectedRecord && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="modal glass-card" style={{ maxWidth: '640px', width: '90%' }}>
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

                  {/* Super Admin Document Status & Viewer */}
                  <h4 style={{ color: 'var(--text-primary)', margin: '1.25rem 0 .75rem' }}>Uploaded Documents Status</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                    {docItems.map((doc) => {
                      const docInfo = getDocDetails(formData.documents, doc.key);
                      const isBusy = uploadingDoc === doc.key;
                      const internUserId = selectedRecord.internId?._id || selectedRecord.internId;

                      return (
                        <div
                          style={{
                            padding: '.75rem',
                            background: docInfo.uploaded ? 'rgba(0,230,118,0.05)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${docInfo.uploaded ? 'rgba(0,230,118,0.25)' : 'rgba(255,255,255,0.08)'}`,
                            borderRadius: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '.4rem'
                          }}
                          key={doc.key}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                              <doc.icon size={15} style={{ color: docInfo.uploaded ? '#00e676' : 'var(--text-muted)' }} />
                              <span style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{doc.label}</span>
                            </div>
                            <span
                              style={{
                                fontSize: '.7rem',
                                fontWeight: 600,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: docInfo.uploaded ? 'rgba(0,230,118,0.15)' : 'rgba(255,145,0,0.15)',
                                color: docInfo.uploaded ? '#00e676' : '#ff9100'
                              }}
                            >
                              {docInfo.uploaded ? '✓ Uploaded' : '✗ Missing'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginTop: '.25rem', flexWrap: 'wrap' }}>
                            {docInfo.uploaded && docInfo.path ? (
                              <>
                                <a
                                  href={docInfo.path}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-xs btn-primary"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    textDecoration: 'none',
                                    fontSize: '.72rem',
                                    padding: '3px 7px'
                                  }}
                                >
                                  <ExternalLink size={12} /> View
                                </a>
                                <a
                                  href={docInfo.path}
                                  download
                                  className="btn btn-xs btn-secondary"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    textDecoration: 'none',
                                    fontSize: '.72rem',
                                    padding: '3px 7px'
                                  }}
                                >
                                  <Download size={12} /> Download
                                </a>
                              </>
                            ) : null}

                            <label
                              className="btn btn-xs btn-ghost"
                              style={{
                                cursor: isBusy ? 'wait' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '.72rem',
                                padding: '3px 7px',
                                color: 'var(--text-muted)'
                              }}
                              title="Upload or replace file on behalf of intern"
                            >
                              {isBusy ? <RefreshCw size={12} className="spin" /> : <Upload size={12} />}
                              <span>{docInfo.uploaded ? 'Replace' : 'Upload'}</span>
                              <input
                                type="file"
                                disabled={isBusy}
                                accept={doc.key === 'photo' ? 'image/*' : '.pdf,.doc,.docx,.png,.jpg,.jpeg'}
                                style={{ display: 'none' }}
                                onChange={(e) => handleAdminUploadDoc(doc.key, internUserId, e)}
                              />
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="form-row" style={{ marginTop: '1rem' }}>
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
