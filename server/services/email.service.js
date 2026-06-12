const nodemailer = require('nodemailer');

// ── Transporter ─────────────────────────────────────────────
const createTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass || user === 'your-email@gmail.com' || pass === 'your-app-password') {
    return null; // no credentials — mock mode
  }

  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  // Default to port 465 (SSL). If you want port 587, set EMAIL_PORT=587 in env.
  const port = parseInt(process.env.EMAIL_PORT) || 465;
  const secure = port === 465; // true for 465 (SSL), false for 587 (STARTTLS)

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

// ── Core send function ──────────────────────────────────────
const sendMail = async (to, subject, html) => {
  const user = process.env.EMAIL_USER;
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log(`📧 [MOCK EMAIL] To: ${to} | Subject: ${subject}`);
      console.log('   -> Set EMAIL_USER + EMAIL_PASS (Gmail App Password) in Vercel env vars to send real emails.');
      return { mocked: true };
    }

    // Gmail REQUIRES the "from" address to match the authenticated EMAIL_USER exactly.
    // Using a different "from" (like noreply@ied.com) will cause Gmail to reject the send.
    const fromName = process.env.EMAIL_FROM_NAME || 'IED India';
    const from = `"${fromName}" <${user}>`;

    const info = await transporter.sendMail({ from, to, subject, html });
    console.log(`📧 [EMAIL SENT] To: ${to} | Subject: ${subject} | MsgId: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`❌ [EMAIL ERROR] To: ${to} | Subject: ${subject}`);
    console.error('   code:', err.code, '| msg:', err.message);
    if (err.response) console.error('   SMTP:', err.response);
    return null; // never throw — email failure must not break API response
  }
};

// ── HTML helpers ────────────────────────────────────────────
const BASE = process.env.CLIENT_URL || 'https://ied-india-internship-portal.vercel.app';

const _wrap = (content) => `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#022654 0%,#073161 100%);padding:28px 32px;text-align:center">
      <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:0.5px">IED India</h1>
      <p style="color:rgba(255,255,255,0.65);margin:4px 0 0;font-size:13px">Internship Management Portal</p>
    </div>
    <div style="padding:32px">${content}</div>
    <div style="background:#f0f4f8;padding:16px 32px;text-align:center">
      <p style="color:#94a3b8;font-size:11px;margin:0">IED India Pvt Ltd &nbsp;|&nbsp; Internship Management System &nbsp;|&nbsp; <a href="${BASE}" style="color:#03377A">Portal</a></p>
    </div>
  </div>`;

const _btn = (text, url, color = '#03377A') =>
  `<div style="text-align:center;margin:24px 0"><a href="${url}" style="background:${color};color:#fff;text-decoration:none;padding:12px 28px;border-radius:30px;font-weight:600;font-size:14px;display:inline-block">${text}</a></div>`;

// ── Email Templates ─────────────────────────────────────────
const emailService = {

  sendApplicationReceived: (email, name) => sendMail(email,
    'Application Received - IED India',
    _wrap(`
      <h2 style="color:#022654;margin-top:0">Application Received!</h2>
      <p style="color:#475569">Dear <strong>${name}</strong>,</p>
      <p style="color:#475569;line-height:1.7">Thank you for applying to intern at <strong>IED India Pvt Ltd</strong>. We have received your application and our HR team will review it shortly.</p>
      <p style="color:#475569;line-height:1.7">We will notify you of any updates via email. Please keep an eye on your inbox.</p>
      <p style="color:#94a3b8;font-size:13px;margin-top:24px">Warm regards,<br><strong>IED India HR Team</strong></p>
    `)),

  sendShortlisted: (email, name) => sendMail(email,
    'You have been Shortlisted! - IED India',
    _wrap(`
      <h2 style="color:#022654;margin-top:0">Congratulations, You have been Shortlisted!</h2>
      <p style="color:#475569">Dear <strong>${name}</strong>,</p>
      <p style="color:#475569;line-height:1.7">We are pleased to inform you that your application to intern at <strong>IED India Pvt Ltd</strong> has been <strong style="color:#03377A">shortlisted</strong> for further review.</p>
      <p style="color:#475569;line-height:1.7">Our team will be scheduling an interview with you soon. Please watch your email for the interview details.</p>
      <p style="color:#94a3b8;font-size:13px;margin-top:24px">Warm regards,<br><strong>IED India HR Team</strong></p>
    `)),

  sendApplicationRejected: (email, name, reason) => sendMail(email,
    'Application Status Update - IED India',
    _wrap(`
      <h2 style="color:#022654;margin-top:0">Application Update</h2>
      <p style="color:#475569">Dear <strong>${name}</strong>,</p>
      <p style="color:#475569;line-height:1.7">Thank you for your interest in interning at <strong>IED India Pvt Ltd</strong>. After careful consideration, we regret to inform you that your application has <strong style="color:#E94560">not been taken forward</strong> at this time.</p>
      ${reason ? `<div style="background:#fff5f5;border-left:4px solid #E94560;border-radius:8px;padding:16px;margin:20px 0"><p style="margin:0;color:#991b1b;font-size:14px"><strong>Reason:</strong> ${reason}</p></div>` : ''}
      <p style="color:#475569;line-height:1.7">We encourage you to apply again in the future. We appreciate your interest and wish you the very best.</p>
      <p style="color:#94a3b8;font-size:13px;margin-top:24px">Warm regards,<br><strong>IED India HR Team</strong></p>
    `)),

  sendInterviewScheduled: (email, name, interview) => sendMail(email,
    'Interview Scheduled - IED India',
    _wrap(`
      <h2 style="color:#022654;margin-top:0">Your Interview has been Scheduled!</h2>
      <p style="color:#475569">Dear <strong>${name}</strong>,</p>
      <p style="color:#475569;line-height:1.7">We are pleased to invite you for an interview at <strong>IED India Pvt Ltd</strong>. Please find the details below:</p>
      <div style="background:#f0f4f8;border-radius:10px;padding:20px;margin:20px 0">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px;width:120px">Date</td><td style="padding:8px 0;color:#0f172a;font-weight:600">${interview.scheduledAt ? new Date(interview.scheduledAt).toDateString() : (interview.scheduledDate ? new Date(interview.scheduledDate).toDateString() : 'To be confirmed')}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Time</td><td style="padding:8px 0;color:#0f172a;font-weight:600">${interview.scheduledAt ? new Date(interview.scheduledAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : (interview.time || 'To be confirmed')}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Mode</td><td style="padding:8px 0;color:#0f172a;font-weight:600;text-transform:capitalize">${(interview.mode || '').replace('_', ' ')}</td></tr>
          ${interview.interviewer ? `<tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Interviewer</td><td style="padding:8px 0;color:#0f172a;font-weight:600">${interview.interviewer}</td></tr>` : ''}
          ${interview.meetLink ? `<tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Meet Link</td><td style="padding:8px 0"><a href="${interview.meetLink}" style="color:#03377A;font-weight:600">${interview.meetLink}</a></td></tr>` : ''}
        </table>
      </div>
      <p style="color:#475569;line-height:1.7">Please be available on time. Reply to this email if you have any questions.</p>
      ${interview.meetLink ? _btn('Join Interview', interview.meetLink, '#03377A') : ''}
      <p style="color:#94a3b8;font-size:13px;margin-top:24px">Warm regards,<br><strong>IED India HR Team</strong></p>
    `)),

  sendInterviewRejected: (email, name, reason) => sendMail(email,
    'Interview Outcome - IED India',
    _wrap(`
      <h2 style="color:#022654;margin-top:0">Interview Outcome</h2>
      <p style="color:#475569">Dear <strong>${name}</strong>,</p>
      <p style="color:#475569;line-height:1.7">Thank you for attending the interview at <strong>IED India Pvt Ltd</strong>. After a thorough evaluation, we regret to inform you that we will <strong style="color:#E94560">not be proceeding</strong> further with your candidature at this time.</p>
      ${reason ? `<div style="background:#fff5f5;border-left:4px solid #E94560;border-radius:8px;padding:16px;margin:20px 0"><p style="margin:0;color:#991b1b;font-size:14px"><strong>Feedback:</strong> ${reason}</p></div>` : ''}
      <p style="color:#475569;line-height:1.7">We truly appreciate your time and wish you the very best in your future endeavours.</p>
      <p style="color:#94a3b8;font-size:13px;margin-top:24px">Warm regards,<br><strong>IED India HR Team</strong></p>
    `)),

  sendSelectionEmail: (email, name, tempPassword) => sendMail(email,
    'Congratulations! You have been Selected - IED India',
    _wrap(`
      <h2 style="color:#022654;margin-top:0">Welcome to IED India!</h2>
      <p style="color:#475569">Dear <strong>${name}</strong>,</p>
      <p style="color:#475569;line-height:1.7">Congratulations! You have been <strong style="color:#10b981">selected</strong> for the internship at <strong>IED India Pvt Ltd</strong>.</p>
      <p style="color:#475569;line-height:1.7">Your portal login credentials:</p>
      <div style="background:#f0f4f8;border-radius:10px;padding:20px;margin:20px 0;border-left:4px solid #10b981">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px;width:140px">Portal URL</td><td style="padding:8px 0"><a href="${BASE}" style="color:#03377A;font-weight:600">${BASE}</a></td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">User ID (Email)</td><td style="padding:8px 0;color:#0f172a;font-weight:700">${email}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Password</td><td style="padding:8px 0;color:#0f172a;font-weight:700;font-family:monospace;font-size:16px">${tempPassword}</td></tr>
        </table>
      </div>
      <p style="color:#E94560;font-size:13px">Please log in and change your password immediately.</p>
      ${_btn('Login to Portal', BASE, '#10b981')}
      <p style="color:#94a3b8;font-size:13px;margin-top:24px">Warm regards,<br><strong>IED India HR Team</strong></p>
    `)),

  sendStatusUpdate: (email, name, status) => sendMail(email,
    'Application Update - IED India',
    _wrap(`
      <h2 style="color:#022654;margin-top:0">Application Status Update</h2>
      <p style="color:#475569">Dear <strong>${name}</strong>,</p>
      <p style="color:#475569;line-height:1.7">Your application status has been updated to: <strong style="color:#03377A;text-transform:uppercase">${status.replace(/_/g, ' ')}</strong></p>
      ${_btn('View Portal', BASE)}
      <p style="color:#94a3b8;font-size:13px;margin-top:24px">Warm regards,<br><strong>IED India HR Team</strong></p>
    `)),
};

module.exports = emailService;
