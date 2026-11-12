import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, User, Briefcase, Paperclip, Send, CreditCard, ShieldCheck } from 'lucide-react';

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
  const [error, setError] = useState('');
  const [paymentConfig, setPaymentConfig] = useState({
    enabled: true,
    amountInr: 99,
    currency: 'INR'
  });

  useEffect(() => {
    fetch('/api/applications/payment-config')
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
  }, []);

  const submitApplicationForm = async (paymentResponse = null) => {
    const fd = new FormData(formRef.current);
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
    setPaymentReceipt(paymentResponse ? {
      paymentId: paymentResponse.razorpay_payment_id,
      amount: paymentConfig.amountInr
    } : null);
    setSuccess(true);
    formRef.current.reset();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setPaymentReceipt(null);
    setLoading(true);

    try {
      if (!paymentConfig.enabled) {
        await submitApplicationForm(null);
        setLoading(false);
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        throw new Error('Could not load Razorpay Checkout. Please check your internet connection and try again.');
      }

      const fd = new FormData(formRef.current);
      const orderRes = await fetch('/api/applications/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fd.get('name'),
          email: fd.get('email'),
          phone: fd.get('phone'),
          department: fd.get('department')
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
        description: 'Internship Application Fee',
        order_id: orderData.orderId,
        prefill: {
          name: String(fd.get('name') || ''),
          email: String(fd.get('email') || ''),
          contact: String(fd.get('phone') || '')
        },
        theme: { color: '#03377A' },
        handler: async (response) => {
          try {
            await submitApplicationForm(response);
          } catch (submitErr) {
            setError(submitErr.message || 'Payment succeeded, but application submission failed.');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setError('Payment was cancelled. Please complete the payment to submit your application.');
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

  return (
    <div id="apply-page" className="apply-page">
      <div className="apply-header">
        <button id="back-to-login" className="btn btn-ghost" onClick={onBackToLogin}>
          <ArrowLeft size={16} /> Back to Login
        </button>
        <h1>Apply for Internship</h1>
        <p>IED India Pvt Ltd</p>
      </div>
      <div className="apply-container">
        <form
          ref={formRef}
          id="apply-form"
          className="apply-form"
          onSubmit={handleSubmit}
          encType="multipart/form-data"
        >
          <div className="form-section">
            <h3>
              <User size={18} style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'text-bottom' }} />{' '}
              Personal Information
            </h3>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" name="name" required placeholder="Your full name" />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" name="email" required placeholder="your@email.com" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone *</label>
                <input type="tel" name="phone" required placeholder="10-digit number" />
              </div>
              <div className="form-group">
                <label>College/University *</label>
                <input type="text" name="college" required placeholder="College name" />
              </div>
            </div>
            <div className="form-group">
              <label>Course/Degree</label>
              <input type="text" name="course" placeholder="e.g. B.Tech Computer Science" />
            </div>
          </div>

          <div className="form-section">
            <h3>
              <Briefcase size={18} style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'text-bottom' }} />{' '}
              Internship Preferences
            </h3>
            <div className="form-row">
              <div className="form-group">
                <label>Department *</label>
                <select name="department" required defaultValue="">
                  <option value="" disabled>
                    Select Department
                  </option>
                  <option>Digital Marketing</option>
                  <option>HR & Recruitment</option>
                  <option>Business Development</option>
                  <option>Social Media</option>
                  <option>Entrepreneurship Training</option>
                  <option>IT Support</option>
                </select>
              </div>
              <div className="form-group">
                <label>Duration (Weeks) *</label>
                <select name="duration" required defaultValue="8">
                  <option value="4">4 Weeks</option>
                  <option value="6">6 Weeks</option>
                  <option value="8">8 Weeks</option>
                  <option value="10">10 Weeks</option>
                  <option value="12">12 Weeks</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Cover Letter / About You</label>
              <textarea
                name="coverLetter"
                rows="4"
                placeholder="Tell us about yourself and why you want to intern at IED India..."
              ></textarea>
            </div>
          </div>

          <div className="form-section">
            <h3>
              <Paperclip size={18} style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'text-bottom' }} />{' '}
              Documents
            </h3>
            <div className="form-row">
              <div className="form-group">
                <label>Resume (PDF) *</label>
                <input type="file" name="resume" accept=".pdf,.doc,.docx" required />
              </div>
              <div className="form-group">
                <label>Passport Photo</label>
                <input type="file" name="photo" accept="image/*" />
              </div>
            </div>
          </div>

          {paymentConfig.enabled && (
            <div className="form-section" style={{ background: 'rgba(3, 55, 122, 0.05)', border: '1px solid rgba(3, 55, 122, 0.16)', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CreditCard size={20} style={{ color: '#03377A' }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>Internship Application Fee</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={14} style={{ color: '#10b981' }} /> Secured by Razorpay Checkout
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#03377A' }}>
                  ₹{paymentConfig.amountInr} <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{paymentConfig.currency}</span>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div id="apply-msg" className="apply-msg-success">
              <div className="toast success" style={{ position: 'static', animation: 'none', width: '100%' }}>
                <span>
                  Application submitted successfully! We will get back to you soon.
                  {paymentReceipt?.paymentId ? ` (Paid ₹${paymentReceipt.amount} • Payment ID: ${paymentReceipt.paymentId})` : ''}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div id="apply-msg" className="error-msg">
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? (
              <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
            ) : (
              <>
                {paymentConfig.enabled ? `Pay ₹${paymentConfig.amountInr} & Submit Application` : 'Submit Application'}{' '}
                <Send size={16} style={{ marginLeft: '6px' }} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ApplyPage;
