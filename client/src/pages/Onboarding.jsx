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
  Download,
  Check,
  CheckCircle,
  QrCode,
  ShieldCheck,
  Lock,
  AlertCircle,
  Calendar,
  ChevronRight,
  Info
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
  const { user, is } = useAuth();
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
    const docs = internRecord?.documents || {};
    const bonafideDoc = getDocDetails(docs, 'collegeId');
    const aadhaarDoc = getDocDetails(docs, 'aadhaar');
    const resumeDoc = getDocDetails(docs, 'resume');
    const photoDoc = getDocDetails(docs, 'photo');

    let completedCount = 2; // profile & fee default verified upon matriculation
    if (bonafideDoc.uploaded) completedCount++;
    if (aadhaarDoc.uploaded) completedCount++;
    if (internRecord?.agreementUploaded) completedCount++;
    if (internRecord?.orientationDone) completedCount++;
    const pct = Math.round((completedCount / 6) * 100);

    const userInitials = (user?.name || 'Aarav Sharma')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: 'Inter, sans-serif' }}>
        {/* Breadcrumb & Subtitle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Workspace &gt; Cohort 2025 &gt; <span style={{ color: '#03377A', fontWeight: 600 }}>Onboarding & Verification</span>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#022654', margin: '4px 0 2px' }}>
              Student Onboarding & Verification
            </h1>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Candidate: <strong style={{ color: '#0f172a' }}>{user?.name || 'Aarav Sharma'}</strong> | UID: <strong style={{ color: '#0f172a' }}>{user?.rollNo || 'STU-2025-IN-9812'}</strong> | Application Ref: <strong style={{ color: '#0f172a' }}>{user?.applicationId || 'IED-APP-2025-09142'}</strong>
            </div>
          </div>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '8px 14px', fontSize: '0.72rem', color: '#1e40af' }}>
            <div style={{ fontWeight: 800, textTransform: 'uppercase', color: '#03377A' }}>PRIORITY DOCKET</div>
            <div>Matriculated via Referral <strong>REF-8842 (Priya Verma)</strong></div>
            <div style={{ color: '#059669', fontWeight: 600 }}>Assigned to Fast-Track Document Queue</div>
          </div>
        </div>

        {/* Onboarding Progress Bar Card */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>Onboarding Progress</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#eff6ff', color: '#1e40af', padding: '2px 8px', borderRadius: '4px' }}>{pct}% Completed</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                {completedCount} of 6 items verified by institutional registrar. Complete remaining items to generate official induction pass.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '20px', fontSize: '0.75rem' }}>
              <div>
                <span style={{ color: '#64748b' }}>ENROLLMENT STATUS: </span>
                <strong style={{ color: '#03377A' }}>Provisional Admit</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>TARGET COHORT: </span>
                <strong style={{ color: '#0f172a' }}>July 2025 (6 Months)</strong>
              </div>
            </div>
          </div>

          <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #022654, #0284c7)', borderRadius: '4px', transition: 'width 0.4s ease' }}></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', flexWrap: 'gap', gap: '6px' }}>
            <span style={{ color: '#059669', fontWeight: 600 }}>✓ 1. Profile Verified</span>
            <span style={{ color: '#059669', fontWeight: 600 }}>✓ 2. Fee Paid</span>
            <span style={{ color: bonafideDoc.uploaded ? '#059669' : '#d97706', fontWeight: 600 }}>
              {bonafideDoc.uploaded ? '✓' : '•'} 3. College ID ({bonafideDoc.uploaded ? 'Verified' : 'Pending'})
            </span>
            <span style={{ color: aadhaarDoc.uploaded ? '#059669' : '#0284c7', fontWeight: 600 }}>
              {aadhaarDoc.uploaded ? '✓' : '•'} 4. National ID ({aadhaarDoc.uploaded ? 'Verified' : 'In OCR'})
            </span>
            <span style={{ color: '#64748b' }}>5. Sign NDA</span>
            <span style={{ color: '#64748b' }}>6. Dev Sandbox</span>
          </div>
        </div>

        {/* 2-Column Deliverables & ID Card Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: '20px', alignItems: 'start' }}>
          {/* Left Column: Deliverables List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckSquare size={16} color="#03377A" /> Mandatory Onboarding Deliverables
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Last automated sync: Today, 11:42 AM IST</span>
            </div>

            {/* Deliverable 1: Profile & Emergency Contact */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={16} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>1. Student Profile & Emergency Contact</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#ecfdf5', color: '#047857', padding: '2px 6px', borderRadius: '4px' }}>Completed & Verified</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>
                    Emergency Guardian: Rajesh Sharma (Father) | Primary Tel: +91 98450-XXXXX | Primary Address: Trichy, Tamil Nadu
                  </div>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm">View Details</button>
            </div>

            {/* Deliverable 2: Matriculation Fee Receipt */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={16} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>2. Internship Matriculation Fee & Tax Receipt</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#ecfdf5', color: '#047857', padding: '2px 6px', borderRadius: '4px' }}>Payment Settled</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>
                    Amount Paid: ₹2,948.82 (Incl. 18% GST) via Razorpay Enterprise Gateway. Transaction Ref: TXN-IED-88319-M
                  </div>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                <Download size={13} /> Receipt IED-REC-2025-09142
              </button>
            </div>

            {/* Deliverable 3: College Bonafide Certificate / Student ID Upload */}
            <div style={{ background: '#ffffff', border: '1.5px solid #bfdbfe', borderRadius: '10px', padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e3a8a' }}>3. College Bonafide Certificate / Student ID</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#fffbeb', color: '#b45309', padding: '2px 6px', borderRadius: '4px' }}>
                      {bonafideDoc.uploaded ? 'Uploaded / Under Review' : 'Action Required / Upload Pending'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '3px' }}>
                    Institutional Record: {user?.college || 'National Institute of Technology, Trichy (NIT Trichy)'}. Required for AICTE academic credit transfer & semester endorsement.
                  </div>
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#dc2626', background: '#fef2f2', padding: '2px 6px', borderRadius: '4px' }}>Due by July 12</span>
              </div>

              {/* Upload Dropzone */}
              <label style={{ border: '2px dashed #93c5fd', borderRadius: '8px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: '#f8fafc', display: 'block', transition: 'all 0.2s ease', margin: '14px 0' }}>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  style={{ display: 'none' }}
                  onChange={(e) => handleUploadDoc('collegeId', e)}
                />
                <Upload size={32} color="#03377A" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                  {bonafideDoc.uploaded ? 'Replace or Re-upload Bonafide Certificate' : 'Click to browse or drag and drop your Bonafide Certificate'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                  Accepted formats: PDF, PNG, JPG (Maximum permissible file size: 5MB)
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '0.72rem', color: '#03377A', marginTop: '8px', fontWeight: 600 }}>
                  <span>✓ Signed by Dean / HOD</span>
                  <span>✓ AICTE / UGC Affiliated Stamp</span>
                </div>
              </label>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                <a href="#bonafide-template" onClick={(e) => { e.preventDefault(); showToast('Bonafide template downloaded to docs', 'info'); }} style={{ color: '#03377A', textDecoration: 'underline' }}>
                  Need an exemption or endorsement letter template? Download IED Bonafide Request Format
                </a>
                <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    style={{ display: 'none' }}
                    onChange={(e) => handleUploadDoc('collegeId', e)}
                  />
                  Submit File for Review
                </label>
              </div>
            </div>

            {/* Deliverable 4: National ID Card (Aadhaar / Passport) */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>4. National Identity Card (Aadhaar / Passport)</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#fffbeb', color: '#b45309', padding: '2px 6px', borderRadius: '4px' }}>
                      {aadhaarDoc.uploaded ? 'Verified' : 'Under Automated AI OCR Verification'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>
                    Uploaded file: aadhaar_front_back_aarav.pdf (2.4 MB) • Extracted Name matches {user?.name || 'Aarav Sharma'} (Confidence: 99.4%)
                  </div>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Est: ~15 mins remaining</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '0.72rem', color: '#64748b', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px' }}>
                <span>Verifying Government UIDAI Signature & Facial Cryptography • Server node: BLR-SECURE-OCR-NODE-4</span>
                <label style={{ color: '#03377A', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    style={{ display: 'none' }}
                    onChange={(e) => handleUploadDoc('aadhaar', e)}
                  />
                  Re-upload Document
                </label>
              </div>
            </div>

            {/* Deliverable 5: NDA & Intellectual Property Code of Conduct */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>5. Internship NDA & Intellectual Property Code of Conduct</span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, background: '#f1f5f9', color: '#64748b', padding: '2px 6px', borderRadius: '4px' }}>
                    Digital Signature Pending
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>
                  Legally binding non-disclosure agreement governing enterprise proprietary algorithms and sandbox code repositories.
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => showToast('Aadhaar OTP dispatched to registered mobile', 'info')}>
                Digital e-Sign (Aadhaar OTP)
              </button>
            </div>

            {/* Deliverable 6: GitHub Enterprise & Cloud Sandbox Provisioning */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>6. GitHub Enterprise & Cloud Sandbox Provisioning</span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, background: '#eff6ff', color: '#1e40af', padding: '2px 6px', borderRadius: '4px' }}>Ready to Initialize</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>
                  Linked GitHub Handle: @aarav-sharma-dev. Will provision access to ied-labs-india/fullstack-ai-cohort upon 100% verification.
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Awaiting Steps 3-5</span>
            </div>
          </div>

          {/* Right Column: Student Credential ID Card, Offer Letter, Orientation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Student Credential ID Pass */}
            <div style={{ background: 'linear-gradient(135deg, #021a3b 0%, #03377A 100%)', color: '#ffffff', borderRadius: '12px', padding: '20px', boxShadow: '0 8px 24px rgba(2, 26, 59, 0.25)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '10px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.04em' }}>
                  <span>🏛️</span> STUDENT CREDENTIAL
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '2px 6px', borderRadius: '4px' }}>
                  PROVISIONAL
                </span>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '8px', background: '#ffffff', color: '#022654', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.4rem', border: '2px solid rgba(255,255,255,0.4)', flexShrink: 0 }}>
                  {userInitials}
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#93c5fd', textTransform: 'uppercase' }}>CANDIDATE NAME</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', marginTop: '2px' }}>{user?.name || 'Aarav Sharma'}</div>
                  <div style={{ fontSize: '0.72rem', color: '#bfdbfe', marginTop: '2px' }}>UID / SERIAL: {user?.rollNo || 'STU-2025-IN-9812'}</div>
                  <div style={{ fontSize: '0.7rem', color: '#93c5fd', marginTop: '2px' }}>TRACK: Full Stack (AI/ML) '25</div>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <QrCode size={28} color="#93c5fd" />
                  <div style={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                    <div style={{ fontWeight: 700 }}>Campus Check-In Pass</div>
                    <div style={{ color: '#93c5fd' }}>Syncs with biometric turnstile</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#34d399', background: 'rgba(16, 185, 129, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>• Active Gate</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#93c5fd', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '8px' }}>
                <span>{user?.college || 'National Institute of Tech, Trichy'}</span>
                <span>VALID THRU: 12/2025</span>
              </div>
            </div>

            {/* Offer Letter Card */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                  Offer Letter #IED-OL-2025-4491
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#fffbeb', color: '#b45309', padding: '2px 6px', borderRadius: '4px' }}>
                  Pending Signature
                </span>
              </div>
              <p style={{ margin: '0 0 14px', fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                Generated by Academic Board on July 02, 2025. Awaiting student NDA execution to release final counter-signed appointment letter.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => showToast('Offer letter draft opened in viewer', 'info')}>
                  Preview Draft
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => showToast('Downloading offer letter PDF', 'info')}>
                  <Download size={14} />
                </button>
              </div>
            </div>

            {/* Orientation Schedule Card */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', marginBottom: '10px' }}>
                <Calendar size={16} color="#03377A" /> Orientation Schedule
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px', fontSize: '0.75rem', color: '#334155' }}>
                <div style={{ fontWeight: 700, color: '#03377A' }}>Virtual Induction: July 15, 2025</div>
                <div style={{ color: '#64748b', marginTop: '2px' }}>10:00 AM – 1:00 PM IST (Via Zoom / Google Meet Enterprise)</div>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '8px' }}>
                🔗 Link will unlock 24 hours prior to session
              </div>
            </div>

            {/* Academic Liaison Card */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', fontSize: '0.75rem', color: '#475569' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>ACADEMIC LIAISON (NIT TRICHY)</div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>Dr. K. Ramanathan, Ph.D.</div>
              <div style={{ color: '#64748b' }}>Dean of Industry Relations & Placements</div>
              <div style={{ color: '#03377A', marginTop: '2px', fontWeight: 600 }}>ramanathan@nitt.edu</div>
              <div style={{ marginTop: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                <span style={{ color: '#03377A', fontWeight: 600, cursor: 'pointer' }} onClick={() => showToast('Support ticket dialog initiated', 'info')}>
                  Need Verification Help? Open Ticket &rarr;
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
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
                  <div style={{ marginTop: '.75rem', paddingTop: '.75rem', borderTop: '1px solid var(--border-color)' }}>
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
                              background: doc.uploaded ? 'rgba(0,230,118,0.08)' : 'var(--bg-primary)',
                              border: `1px solid ${doc.uploaded ? 'rgba(0,230,118,0.25)' : 'var(--border-color)'}`,
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
            <form onSubmit={handleSaveChecklist} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
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
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
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
                                background: isChecked ? '#00e676' : 'rgba(0,0,0,0.15)',
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
                                transition: 'left .2s',
                                boxShadow: isChecked ? 'none' : '0 1px 3px rgba(0,0,0,0.3)'
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
                            background: docInfo.uploaded ? 'rgba(0,230,118,0.05)' : 'var(--bg-primary)',
                            border: `1px solid ${docInfo.uploaded ? 'rgba(0,230,118,0.3)' : 'var(--border-color)'}`,
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
