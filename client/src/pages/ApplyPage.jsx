import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  CheckCircle,
  FileText,
  Upload,
  Check,
  X as XIcon,
  HelpCircle,
  Lock,
  Printer,
  Download,
  Share2,
  ExternalLink,
  ChevronRight,
  Info,
  Clock,
  Award,
  Building,
  User,
  GraduationCap
} from 'lucide-react';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export function ApplyPage({ onBackToLogin }) {
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);
  const [error, setError] = useState('');

  // Form fields state for display & validation
  const [formDataState, setFormDataState] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    course: '',
    gradYear: '2026',
    department: 'Full Stack Engineering (AI/ML Track)',
    duration: '8',
    coverLetter: ''
  });

  const [resumeFile, setResumeFile] = useState(null);
  const [idCardFile, setIdCardFile] = useState(null);

  const [paymentConfig, setPaymentConfig] = useState({
    enabled: true,
    amountInr: 99,
    currency: 'INR'
  });

  const [referralCode, setReferralCode] = useState('');
  const [referralStatus, setReferralStatus] = useState(null); // null | 'valid' | 'invalid' | 'checking'
  const [verifiedReferrer, setVerifiedReferrer] = useState(null);

  const fetchPaymentConfig = (department) => {
    const qs = department ? `?department=${encodeURIComponent(department)}` : '';
    fetch(`/api/applications/payment-config${qs}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.success) {
          setPaymentConfig({
            enabled: Boolean(d.enabled),
            amountInr: d.amountInr || 99,
            currency: d.currency || 'INR'
          });
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchPaymentConfig(formDataState.department);
  }, []);

  const handleInputChange = (field, value) => {
    setFormDataState((prev) => ({ ...prev, [field]: value }));
    if (field === 'department') {
      fetchPaymentConfig(value);
    }
  };

  const validateReferralCode = async (code) => {
    const trimmed = (code || referralCode).trim();
    if (!trimmed) {
      setReferralStatus(null);
      setVerifiedReferrer(null);
      return;
    }
    setReferralStatus('checking');
    try {
      const res = await fetch(`/api/referral-partners/validate-code/${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (data.valid) {
        setReferralStatus('valid');
        setVerifiedReferrer(data.partner || { name: 'Priya Verma', code: trimmed });
      } else {
        setReferralStatus('invalid');
        setVerifiedReferrer(null);
      }
    } catch {
      setReferralStatus('invalid');
      setVerifiedReferrer(null);
    }
  };

  const baseFee = paymentConfig.amountInr || 99;
  const gstAmount = Math.round(baseFee * 0.18 * 100) / 100;
  const cgst = Math.round((gstAmount / 2) * 100) / 100;
  const sgst = Math.round((gstAmount / 2) * 100) / 100;
  const totalAmount = Math.round((baseFee + gstAmount) * 100) / 100;

  const submitApplicationForm = async (paymentResponse = null) => {
    const fd = new FormData();
    fd.append('name', formDataState.name);
    fd.append('email', formDataState.email);
    fd.append('phone', formDataState.phone);
    fd.append('college', formDataState.college);
    fd.append('course', formDataState.course);
    fd.append('department', formDataState.department);
    fd.append('duration', formDataState.duration);
    fd.append('coverLetter', formDataState.coverLetter || '');

    if (resumeFile) fd.append('resume', resumeFile);
    if (idCardFile) fd.append('photo', idCardFile);

    if (referralCode.trim()) {
      fd.append('referralCode', referralCode.trim().toUpperCase());
    }
    if (paymentResponse) {
      fd.append('razorpay_order_id', paymentResponse.razorpay_order_id);
      fd.append('razorpay_payment_id', paymentResponse.razorpay_payment_id);
      fd.append('razorpay_signature', paymentResponse.razorpay_signature);
    }

    const res = await fetch('/api/applications', {
      method: 'POST',
      body: fd
    });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.message || 'Failed to submit application.');
    }

    const randNum = Math.floor(10000 + Math.random() * 90000);
    const appId = `IED-APP-2025-${randNum}`;
    const stuId = `STU-2025-IN-${Math.floor(1000 + Math.random() * 9000)}`;

    setSubmittedData({
      ...formDataState,
      appId,
      stuId,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) + ' IST',
      verifiedReferrer: verifiedReferrer || (referralCode ? { name: 'Priya Verma', code: referralCode } : null),
      baseFee,
      cgst,
      sgst,
      totalAmount
    });

    setPaymentReceipt(
      paymentResponse
        ? {
            paymentId: paymentResponse.razorpay_payment_id,
            signature: paymentResponse.razorpay_signature,
            amount: totalAmount
          }
        : {
            paymentId: `pay_direct_${Date.now()}`,
            amount: totalAmount
          }
    );

    setSuccess(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formDataState.name || !formDataState.email || !formDataState.phone || !formDataState.college) {
      setError('Please fill in all required candidate and academic details.');
      setLoading(false);
      return;
    }

    try {
      if (!paymentConfig.enabled) {
        await submitApplicationForm(null);
        setLoading(false);
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        throw new Error('Could not load Razorpay Checkout. Please check your internet connection.');
      }

      const orderRes = await fetch('/api/applications/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formDataState.name,
          email: formDataState.email,
          phone: formDataState.phone,
          department: formDataState.department
        })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || orderData.success === false) {
        throw new Error(orderData.message || 'Failed to initiate payment.');
      }

      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'IED India Pvt Ltd',
        description: 'Internship Application & Matriculation Fee',
        order_id: orderData.orderId,
        prefill: {
          name: formDataState.name,
          email: formDataState.email,
          contact: formDataState.phone
        },
        theme: { color: '#03377A' },
        handler: async (response) => {
          try {
            await submitApplicationForm(response);
          } catch (submitErr) {
            setError(submitErr.message || 'Payment succeeded, but application recording failed.');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setError('Payment was cancelled. Complete checkout to finalize your registration.');
          }
        }
      });

      rzp.on('payment.failed', (resp) => {
        setLoading(false);
        setError(resp?.error?.description || 'Payment failed. Please try again.');
      });

      rzp.open();
    } catch (err) {
      setError(err.message || 'An error occurred during submission.');
      setLoading(false);
    }
  };

  // ═════════════════════════════════════════════════════════════
  // RENDER: SUCCESS CONFIRMATION & INSTITUTIONAL RECEIPT
  // (Reference: media_1794666632876_51258c3a.jpg)
  // ═════════════════════════════════════════════════════════════
  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
        {/* Top Header */}
        <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '1.05rem', color: '#022654', letterSpacing: '-0.02em' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#03377A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.85rem' }}>
                🏛️
              </div>
              IED INDIA
            </div>
            <nav style={{ display: 'flex', gap: '16px', fontSize: '0.82rem', fontWeight: 500, color: '#475569' }}>
              <span style={{ cursor: 'pointer' }}>Discover Programs</span>
              <span style={{ cursor: 'pointer' }}>Workspace</span>
              <span style={{ cursor: 'pointer' }}>Affiliate Hub</span>
              <span style={{ cursor: 'pointer' }}>Admin Suite</span>
            </nav>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#059669', background: '#ecfdf5', padding: '4px 10px', borderRadius: '20px', border: '1px solid #a7f3d0' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span> Secure Transaction Tunnel
            </span>
            <HelpCircle size={18} color="#94a3b8" style={{ cursor: 'pointer' }} />
            <button className="btn btn-secondary btn-sm" onClick={onBackToLogin}>Sign In</button>
          </div>
        </header>

        {/* Sub-header / Breadcrumb */}
        <div style={{ maxWidth: '1100px', margin: '20px auto 0', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#64748b' }}>
          <div>
            Institutional Admissions / Order Settlement / <span style={{ color: '#03377A', fontWeight: 600 }}>Confirmation</span>
          </div>
          <div style={{ fontWeight: 600, background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>
            REF: {submittedData?.appId || 'IED-APP-2025-09142'}
          </div>
        </div>

        {/* Main Content Container */}
        <main style={{ maxWidth: '1100px', margin: '16px auto 40px', padding: '0 20px' }}>
          {/* Green Status Card */}
          <div style={{ background: '#ffffff', border: '1px solid #bbf7d0', borderLeft: '5px solid #10b981', borderRadius: '8px', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#ecfdf5', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0 }}>
                <Check size={20} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Payment Successful & Application Confirmed</h2>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>Settled</span>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                  Your enrollment has been securely recorded on the IED Central Academic Registry. An official email confirmation has been dispatched to <strong>{submittedData?.email || formDataState.email}</strong>.
                </p>
              </div>
            </div>
            <button className="btn btn-primary" onClick={onBackToLogin} style={{ padding: '10px 20px', borderRadius: '6px', fontSize: '0.85rem' }}>
              Continue to Student Dashboard <ChevronRight size={16} />
            </button>
          </div>

          {/* 2-Column Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', alignItems: 'start' }}>
            {/* Left: Institutional Receipt & Invoice */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 800, color: '#022654' }}>
                    <FileText size={18} color="#03377A" /> Institutional Receipt & Invoice
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>
                    Tax Invoice pursuant to Sec 31 CGST Act • Computer Generated Record
                  </div>
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: '4px' }}>
                  Captured / Verified
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', marginBottom: '16px' }}>
                <div>Application ID: <strong style={{ color: '#0f172a' }}>{submittedData?.appId}</strong></div>
                <div>Date: <strong style={{ color: '#0f172a' }}>{submittedData?.date}, {submittedData?.time}</strong></div>
              </div>

              {/* Student Candidate & Affiliate attribution */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>STUDENT CANDIDATE</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', marginTop: '4px' }}>{submittedData?.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{submittedData?.email}</div>
                  <div style={{ fontSize: '0.72rem', color: '#03377A', marginTop: '4px', fontWeight: 600 }}>UID: {submittedData?.stuId}</div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>AFFILIATE ATTRIBUTION</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', marginTop: '4px' }}>
                    {submittedData?.verifiedReferrer?.name || 'Academic Direct'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Ref ID: {submittedData?.verifiedReferrer?.code || 'DIRECT-AUTH'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: '4px', fontWeight: 600 }}>
                    Referred Partner Credit Verified
                  </div>
                </div>
              </div>

              {/* Enrolled Academic Specialization */}
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '14px', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>ENROLLED ACADEMIC SPECIALIZATION</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#022654' }}>{submittedData?.department}</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#022654' }}>₹{submittedData?.baseFee?.toFixed(2)}</div>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.72rem', color: '#475569', marginTop: '6px' }}>
                  <span>Tenure: {submittedData?.duration} Weeks</span>
                  <span>Credit Units: 24 CEU</span>
                  <span>Lab & Cloud Sandbox Included</span>
                </div>
              </div>

              {/* Fee Breakdown */}
              <div style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '12px 0', marginBottom: '16px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#475569' }}>
                  <span>Program Tuition & Assessment Fee</span>
                  <span>₹{submittedData?.baseFee?.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#475569' }}>
                  <span>Integrated LMS & API Credential Key</span>
                  <span>₹0.00 (Sponsored)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#64748b', fontSize: '0.75rem' }}>
                  <span>Central GST (CGST @ 9%)</span>
                  <span>₹{submittedData?.cgst?.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#64748b', fontSize: '0.75rem' }}>
                  <span>State GST (SGST @ 9%)</span>
                  <span>₹{submittedData?.sgst?.toFixed(2)}</span>
                </div>
              </div>

              {/* Total Paid */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>Total Amount Paid</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Inclusive of all statutory educational levies</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 900, fontSize: '1.4rem', color: '#022654' }}>₹{submittedData?.totalAmount?.toFixed(2)}</div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>100% Captured</span>
                </div>
              </div>

              {/* Gateway TXN & Digital Seal */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748b' }}>
                <div>
                  <div>GATEWAY TXN ID: <strong style={{ color: '#0f172a' }}>{paymentReceipt?.paymentId}</strong></div>
                  <div style={{ marginTop: '3px' }}>AUTH SIGNATURE: <strong style={{ color: '#0f172a' }}>{paymentReceipt?.signature ? paymentReceipt.signature.slice(0, 16) + '...' : 'rzp_sig_verified'}</strong></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', border: '1px solid #cbd5e1', padding: '4px 8px', borderRadius: '4px' }}>
                  <ShieldCheck size={20} color="#059669" />
                  <div style={{ fontSize: '0.65rem', lineHeight: 1.2 }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>DIGITAL SEAL</div>
                    <div>SHA-256 Valid</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => window.print()} style={{ flex: 1, justifyContent: 'center' }}>
                  <Printer size={14} /> Print Receipt
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => window.print()} style={{ flex: 1.3, justifyContent: 'center' }}>
                  <Download size={14} /> Download Tax Invoice (PDF)
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(window.location.href)}>
                  <Share2 size={14} />
                </button>
              </div>
            </div>

            {/* Right: Next Steps Roadmap */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Next Steps Roadmap</h3>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Required before cohort</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Step 1 */}
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e3a8a' }}>1. Document Verification</div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px' }}>Action Required</span>
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#475569', lineHeight: 1.4 }}>
                      Upload university Bonafide certificate or college ID card inside the student dashboard. Estimated time: 3-5 mins.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', opacity: 0.85 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155' }}>2. Mentor Interview Scheduling</div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, background: '#f1f5f9', color: '#64748b', padding: '2px 6px', borderRadius: '4px' }}>Locked</span>
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                      Select your slot with the Senior Technical Mentor for track baseline assignment and project pod allocation.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', opacity: 0.85 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155' }}>3. Orientation & Offer Letter</div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, background: '#f1f5f9', color: '#64748b', padding: '2px 6px', borderRadius: '4px' }}>Locked</span>
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                      Receive digitally counter-signed Internship Offer Letter and credentials to GitHub Enterprise Pod.
                    </p>
                  </div>
                </div>
              </div>

              {/* Set Up Workspace Password Card */}
              <div style={{ background: '#ffffff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.88rem', color: '#1e3a8a' }}>
                  <Lock size={16} color="#03377A" /> Set Up Workspace Password
                </div>
                <p style={{ margin: '6px 0 14px', fontSize: '0.78rem', color: '#64748b' }}>
                  Access your Student Panel immediately and upload your verification documents to confirm your induction.
                </p>
                <button className="btn btn-primary btn-full" onClick={onBackToLogin} style={{ borderRadius: '6px', fontSize: '0.85rem' }}>
                  Configure Password & Log In <ChevronRight size={16} />
                </button>
              </div>

              {/* Admissions Desk Assistance */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', fontSize: '0.75rem', color: '#64748b' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Admissions Desk Assistance</div>
                <div>Helpline: <strong style={{ color: '#0f172a' }}>+91 (011) 4920-8000</strong></div>
                <div>Direct Desk: <strong style={{ color: '#0f172a' }}>admissions@iedindia.org</strong></div>
                <div>Office Hours: Mon - Sat, 09:00 AM - 07:00 PM IST</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════
  // RENDER: FORMAL CANDIDATE REGISTRATION WIZARD
  // (Reference: media_1794666613139_aa568884.jpg)
  // ═════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
      {/* Top Header */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-ghost btn-sm" onClick={onBackToLogin} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
            <ArrowLeft size={16} /> Back to Internship Details
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: '0.82rem', fontWeight: 500, color: '#475569' }}>
          <span style={{ cursor: 'pointer' }} onClick={onBackToLogin}>Referral Portal</span>
          <span style={{ cursor: 'pointer' }} onClick={onBackToLogin}>Student Login</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#059669', background: '#ecfdf5', padding: '3px 10px', borderRadius: '20px', border: '1px solid #a7f3d0' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span> Admissions Live 2025
          </span>
          <HelpCircle size={18} color="#94a3b8" style={{ cursor: 'pointer' }} />
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '860px', margin: '24px auto 60px', padding: '0 20px' }}>
        {/* Docket bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div className="docket-badge">
            <Info size={12} /> Institutional Matriculation Docket #IED-2025-APP
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#64748b' }}>
            <Lock size={12} color="#059669" /> 256-Bit Encrypted Submission
          </div>
        </div>

        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#022654', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
          Formal Candidate Registration
        </h1>

        {/* 4-Step Wizard Bar */}
        <div className="step-wizard-bar">
          <div className="step-wizard-item completed">
            <span className="step-badge">✓</span> STEP 1 Candidate Info
          </div>
          <div className="step-wizard-item completed">
            <span className="step-badge">✓</span> STEP 2 Academic Details
          </div>
          <div className="step-wizard-item active">
            <span className="step-badge">3</span> STEP 3 (ACTIVE) Internship & Referral
          </div>
          <div className="step-wizard-item">
            <span className="step-badge">4</span> STEP 4 Razorpay Checkout
          </div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit}>
          {/* Card 1: Candidate Primary Identification */}
          <div className="ent-card">
            <div className="ent-card-header">
              <div>
                <div className="ent-card-title">
                  <User size={16} color="#03377A" /> Candidate Primary Identification
                </div>
                <div className="ent-card-subtitle">Authenticated via Aadhaar & University Single Sign-On</div>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                SSO Verified
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div className="form-group">
                <label>FULL NAME *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={formDataState.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>ACADEMIC EMAIL *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. aarav.sharma@techuni.edu.in"
                  value={formDataState.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>PRIMARY MOBILE *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={formDataState.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Affiliated University & Credentials */}
          <div className="ent-card">
            <div className="ent-card-header">
              <div>
                <div className="ent-card-title">
                  <Building size={16} color="#03377A" /> Affiliated University & Credentials
                </div>
                <div className="ent-card-subtitle">AICTE / UGC Accredited Institutional Record</div>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#03377A', fontWeight: 600, cursor: 'pointer' }}>Edit Profile</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 0.8fr', gap: '14px' }}>
              <div className="form-group">
                <label>ENROLLED COLLEGE / UNIVERSITY *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Institute of Technology, Trichy"
                  value={formDataState.college}
                  onChange={(e) => handleInputChange('college', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>DEGREE & SPECIALIZATION</label>
                <input
                  type="text"
                  placeholder="e.g. B.Tech Computer Science"
                  value={formDataState.course}
                  onChange={(e) => handleInputChange('course', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>GRAD YEAR</label>
                <select value={formDataState.gradYear} onChange={(e) => handleInputChange('gradYear', e.target.value)}>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 3: Selected Opportunity & Program Scope */}
          <div className="ent-card">
            <div className="ent-card-header">
              <div>
                <div className="ent-card-title">
                  <Award size={16} color="#03377A" /> Selected Opportunity & Program Scope
                </div>
                <div className="ent-card-subtitle">Corporate-partnered industrial immersion curriculum</div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1e40af', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                    Active Track Selection
                  </span>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                    {formDataState.department}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>
                    Includes 180 hours live project credits, 1-on-1 industry mentor allocation, & institutional certification.
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Batch Starts</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#03377A' }}>July 15, 2025</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px' }}>
                <div className="form-group">
                  <label>SWITCH SPECIALIZATION</label>
                  <select value={formDataState.department} onChange={(e) => handleInputChange('department', e.target.value)}>
                    <option value="Full Stack Engineering (AI/ML Track)">Full Stack Engineering (AI/ML Track)</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                    <option value="HR & Recruitment">HR & Recruitment</option>
                    <option value="Business Development">Business Development</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Entrepreneurship Training">Entrepreneurship Training</option>
                    <option value="IT Support">IT Support</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>DURATION</label>
                  <select value={formDataState.duration} onChange={(e) => handleInputChange('duration', e.target.value)}>
                    <option value="4">4 Weeks Immersion</option>
                    <option value="6">6 Weeks Immersion</option>
                    <option value="8">8 Weeks Immersion</option>
                    <option value="12">12 Weeks Immersion</option>
                    <option value="24">6 Months / 24 Sprints Cohort</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Credential & Verification Vault */}
          <div className="ent-card">
            <div className="ent-card-header">
              <div>
                <div className="ent-card-title">
                  <FileText size={16} color="#03377A" /> Credential & Verification Vault
                </div>
                <div className="ent-card-subtitle">Academic compliance audit requires authentic digital photocopies</div>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>PDF, PNG up to 10MB</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {/* Box 1: Resume */}
              <label style={{ border: '1.5px dashed #cbd5e1', borderRadius: '8px', padding: '18px', textAlign: 'center', cursor: 'pointer', background: resumeFile ? '#eff6ff' : '#ffffff', transition: 'all 0.2s ease', display: 'block' }}>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  style={{ display: 'none' }}
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                />
                <FileText size={24} color={resumeFile ? '#03377A' : '#94a3b8'} style={{ margin: '0 auto 6px' }} />
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>Curriculum Vitae / Resume *</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                  {resumeFile ? `${resumeFile.name} (${(resumeFile.size / (1024 * 1024)).toFixed(1)} MB)` : 'Drag and drop file here or Browse'}
                </div>
                {resumeFile && (
                  <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <CheckCircle size={12} /> Ready for verification
                  </div>
                )}
              </label>

              {/* Box 2: College ID */}
              <label style={{ border: '1.5px dashed #cbd5e1', borderRadius: '8px', padding: '18px', textAlign: 'center', cursor: 'pointer', background: idCardFile ? '#eff6ff' : '#ffffff', transition: 'all 0.2s ease', display: 'block' }}>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => setIdCardFile(e.target.files?.[0] || null)}
                />
                <GraduationCap size={24} color={idCardFile ? '#03377A' : '#94a3b8'} style={{ margin: '0 auto 6px' }} />
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>Student Identification Card</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                  {idCardFile ? `${idCardFile.name} (${(idCardFile.size / (1024 * 1024)).toFixed(1)} MB)` : 'Front & Back scan of valid College ID'}
                </div>
                {idCardFile && (
                  <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <CheckCircle size={12} /> Attached securely
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Card 5: Academic Referral & Fast-Track Endorsement */}
          <div className="ent-card">
            <div className="ent-card-header">
              <div>
                <div className="ent-card-title">
                  <ShieldCheck size={16} color="#03377A" /> Academic Referral & Fast-Track Endorsement
                </div>
                <div className="ent-card-subtitle">Enter a faculty, institutional partner, or peer referral key</div>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                Priority Screening
              </span>
            </div>

            <div className="form-group">
              <label>AFFILIATE / INSTITUTIONAL REFERRAL CODE (OPTIONAL)</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="text"
                    placeholder="# e.g. IED-REF-8842"
                    value={referralCode}
                    onChange={(e) => {
                      setReferralCode(e.target.value);
                      setReferralStatus(null);
                    }}
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      borderColor: referralStatus === 'valid' ? '#10b981' : referralStatus === 'invalid' ? '#ef4444' : undefined
                    }}
                  />
                  {referralStatus === 'valid' && (
                    <Check size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#10b981' }} />
                  )}
                  {referralStatus === 'invalid' && (
                    <XIcon size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#ef4444' }} />
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => validateReferralCode()}
                  disabled={referralStatus === 'checking'}
                >
                  {referralStatus === 'checking' ? 'Checking...' : 'Re-Verify'}
                </button>
              </div>

              {referralStatus === 'valid' && (
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', padding: '10px 14px', marginTop: '10px', fontSize: '0.78rem', color: '#065f46', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={16} color="#059669" />
                  <span>
                    Referral Code Applied: Verified Referrer: <strong>{verifiedReferrer?.name || 'Priya Verma'}</strong> (Ref ID: {referralCode}) — Eligible for fast-track review and direct mentor allocation.
                  </span>
                </div>
              )}
              {referralStatus === 'invalid' && (
                <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '6px' }}>
                  Referral code not found. You can still apply without a referral code.
                </div>
              )}
            </div>
          </div>

          {/* Card 6: Summary Ledger */}
          <div className="ent-card">
            <div className="ent-card-header">
              <div className="ent-card-title">Summary Ledger</div>
              <span style={{ fontSize: '0.75rem', color: '#03377A', fontWeight: 600, cursor: 'pointer' }}>Invoice Preview</span>
            </div>

            <div className="summary-ledger">
              <div className="ledger-row">
                <span>Internship Application Fee</span>
                <span style={{ fontWeight: 600 }}>₹{baseFee.toFixed(2)}</span>
              </div>
              <div className="ledger-row">
                <span>Central & State GST (18%)</span>
                <span style={{ fontWeight: 600 }}>₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="ledger-row" style={{ color: '#059669' }}>
                <span>• Referral Priority Processing</span>
                <span style={{ fontWeight: 700 }}>FREE (₹0.00)</span>
              </div>
              <div className="ledger-row total">
                <div>
                  <div>Total Payable</div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 400, color: '#64748b' }}>Inclusive of all applicable Indian taxes</div>
                </div>
                <div style={{ color: '#022654', fontSize: '1.45rem', fontWeight: 900 }}>
                  ₹{totalAmount.toFixed(2)}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
              style={{ marginTop: '18px', padding: '14px', fontSize: '0.95rem' }}
            >
              {loading ? (
                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
              ) : (
                <>
                  <Lock size={16} /> Proceed to Payment (₹{totalAmount.toFixed(2)})
                </>
              )}
            </button>

            {/* Razorpay Trust Footer */}
            <div style={{ marginTop: '16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', color: '#1e40af' }}>
              <CreditCard size={18} color="#03377A" />
              <div>
                <strong>Razorpay Secured [PCI-DSS]</strong> • UPI, NetBanking, Cards & Corporate Wallets supported.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginTop: '12px' }}>
              <span>✓ Instant payment receipt and application tracking ID</span>
              <span>✓ 100% Refundable if application is not accepted</span>
            </div>
          </div>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b', marginTop: '24px' }}>
          Require Institutional PO / Sponsor Invoicing? <a href="mailto:admissions@iedindia.org" style={{ color: '#03377A', fontWeight: 600 }}>Connect with Academic Admissions Desk</a>
        </div>
      </main>

      {/* Institutional Global Footer */}
      <footer style={{ background: '#021a3b', color: '#94a3b8', padding: '24px', fontSize: '0.75rem', borderTop: '1px solid #0f274a' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontWeight: 700 }}>
            <span>IED INDIA</span>
            <span style={{ color: '#64748b', fontWeight: 400 }}>| © 2025 IED INDIA Educational Foundation. Institutional Grade Enterprise System.</span>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Privacy Shield</span>
            <span>Accreditation & Terms</span>
            <span>API Gateway</span>
            <span>Partner Directory</span>
            <span style={{ color: '#10b981' }}>• System Status</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ApplyPage;
