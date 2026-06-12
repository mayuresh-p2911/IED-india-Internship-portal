/**
 * IED India — Email Service
 * Uses Resend API (HTTPS) instead of SMTP.
 * Vercel blocks all SMTP ports, so SMTP never works on Vercel.
 * Resend API works over HTTPS and is free (3,000 emails/month).
 */
const https = require('https');

const BASE = process.env.CLIENT_URL || 'https://ied-india-internship-portal.vercel.app';
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// The "from" address. With free Resend (no custom domain), you must use:
//   onboarding@resend.dev  (works for sending to any address)
// Once you verify your own domain in Resend dashboard, change this to your domain email.
const FROM_ADDRESS = process.env.EMAIL_FROM || 'IED India <onboarding@resend.dev>';

// ── Core send via Resend API ────────────────────────────────
const sendMail = (to, subject, html) => {
  return new Promise((resolve) => {
    if (!RESEND_API_KEY) {
      console.log(`📧 [MOCK EMAIL] To: ${to} | Subject: ${subject}`);
      console.log('   → Add RESEND_API_KEY to Vercel env vars to send real emails.');
      return resolve({ mocked: true });
    }

    const body = JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html });

    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log(`📧 [EMAIL SENT] To: ${to} | Subject: ${subject}`);
          resolve(JSON.parse(data));
        } else {
          console.error(`❌ [EMAIL ERROR] Status ${res.statusCode} | To: ${to}`);
          console.error('   Response:', data);
          resolve(null);
        }
      });
    });

    req.on('error', (err) => {
      console.error(`❌ [EMAIL ERROR] To: ${to} | ${err.message}`);
      resolve(null);
    });

    req.write(body);
    req.end();
  });
};

// ── HTML helpers ────────────────────────────────────────────
const _wrap = (content) => `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#022654 0%,#073161 100%);padding:28px 32px;text-align:center">
      <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:0.5px">IED India</h1>
      <p style="color:rgba(255,255,255,0.65);margin:4px 0 0;font-size:13px">Internship Management Portal</p>
    </div>
    <div style="padding:32px">${content}</div>
    <div style="background:#f0f4f8;padding:16px 32px;text-align:center">
      <p style="color:#94a3b8;font-size:11px;margin:0">IED India Pvt Ltd &nbsp;|&nbsp; <a href="${BASE}" style="color:#03377A">Portal</a></p>
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
      <p style="color:#94a3b8;font-size:13px;margin-top:24px">Warm regards,<br><strong>IED India HR Team</strong></p>
    `)),

  sendShortlisted: (email, name) => sendMail(email,
    'You have been Shortlisted! - IED India',
    _wrap(`
      <h2 style="color:#022654;margin-top:0">Congratulations, You have been Shortlisted!</h2>
      <p style="color:#475569">Dear <strong>${name}</strong>,</p>
      <p style="color:#475569;line-height:1.7">Your application to intern at <strong>IED India Pvt Ltd</strong> has been <strong style="color:#03377A">shortlisted</strong>. Our team will schedule an interview with you soon.</p>
      <p style="color:#94a3b8;font-size:13px;margin-top:24px">Warm regards,<br><strong>IED India HR Team</strong></p>
    `)),

  sendApplicationRejected: (email, name, reason) => sendMail(email,
    'Application Status Update - IED India',
    _wrap(`
      <h2 style="color:#022654;margin-top:0">Application Update</h2>
      <p style="color:#475569">Dear <strong>${name}</strong>,</p>
      <p style="color:#475569;line-height:1.7">After careful consideration, we regret to inform you that your application has <strong style="color:#E94560">not been taken forward</strong> at this time.</p>
      ${reason ? `<div style="background:#fff5f5;border-left:4px solid #E94560;border-radius:8px;padding:16px;margin:20px 0"><p style="margin:0;color:#991b1b;font-size:14px"><strong>Reason:</strong> ${reason}</p></div>` : ''}
      <p style="color:#475569;line-height:1.7">We encourage you to apply again in the future.</p>
      <p style="color:#94a3b8;font-size:13px;margin-top:24px">Warm regards,<br><strong>IED India HR Team</strong></p>
    `)),

  sendInterviewScheduled: (email, name, interview) => sendMail(email,
    'Interview Scheduled - IED India',
    _wrap(`
      <h2 style="color:#022654;margin-top:0">Your Interview has been Scheduled!</h2>
      <p style="color:#475569">Dear <strong>${name}</strong>,</p>
      <p style="color:#475569;line-height:1.7">You are invited for an interview at <strong>IED India Pvt Ltd</strong>. Details below:</p>
      <div style="background:#f0f4f8;border-radius:10px;padding:20px;margin:20px 0">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px;width:120px">Date</td><td style="padding:8px 0;color:#0f172a;font-weight:600">${interview.scheduledAt ? new Date(interview.scheduledAt).toDateString() : (interview.scheduledDate ? new Date(interview.scheduledDate).toDateString() : 'To be confirmed')}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Time</td><td style="padding:8px 0;color:#0f172a;font-weight:600">${interview.scheduledAt ? new Date(interview.scheduledAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : (interview.time || 'To be confirmed')}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Mode</td><td style="padding:8px 0;color:#0f172a;font-weight:600;text-transform:capitalize">${(interview.mode || '').replace('_', ' ')}</td></tr>
          ${interview.interviewer ? `<tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Interviewer</td><td style="padding:8px 0;color:#0f172a;font-weight:600">${interview.interviewer}</td></tr>` : ''}
          ${interview.meetLink ? `<tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Meet Link</td><td style="padding:8px 0"><a href="${interview.meetLink}" style="color:#03377A;font-weight:600">${interview.meetLink}</a></td></tr>` : ''}
        </table>
      </div>
      ${interview.meetLink ? _btn('Join Interview', interview.meetLink, '#03377A') : ''}
      <p style="color:#94a3b8;font-size:13px;margin-top:24px">Warm regards,<br><strong>IED India HR Team</strong></p>
    `)),

  sendInterviewRejected: (email, name, reason) => sendMail(email,
    'Interview Outcome - IED India',
    _wrap(`
      <h2 style="color:#022654;margin-top:0">Interview Outcome</h2>
      <p style="color:#475569">Dear <strong>${name}</strong>,</p>
      <p style="color:#475569;line-height:1.7">Thank you for attending the interview. After evaluation, we will <strong style="color:#E94560">not be proceeding</strong> further at this time.</p>
      ${reason ? `<div style="background:#fff5f5;border-left:4px solid #E94560;border-radius:8px;padding:16px;margin:20px 0"><p style="margin:0;color:#991b1b;font-size:14px"><strong>Feedback:</strong> ${reason}</p></div>` : ''}
      <p style="color:#94a3b8;font-size:13px;margin-top:24px">Warm regards,<br><strong>IED India HR Team</strong></p>
    `)),

  sendSelectionEmail: (email, name, tempPassword) => sendMail(email,
    'Congratulations! You have been Selected - IED India',
    _wrap(`
      <h2 style="color:#022654;margin-top:0">Welcome to IED India!</h2>
      <p style="color:#475569">Dear <strong>${name}</strong>,</p>
      <p style="color:#475569;line-height:1.7">Congratulations! You have been <strong style="color:#10b981">selected</strong> for the internship at <strong>IED India Pvt Ltd</strong>!</p>
      <div style="background:#f0f4f8;border-radius:10px;padding:20px;margin:20px 0;border-left:4px solid #10b981">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px;width:140px">Portal URL</td><td style="padding:8px 0"><a href="${BASE}" style="color:#03377A;font-weight:600">${BASE}</a></td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">User ID (Email)</td><td style="padding:8px 0;color:#0f172a;font-weight:700">${email}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Password</td><td style="padding:8px 0;color:#0f172a;font-weight:700;font-family:monospace;font-size:16px">${tempPassword}</td></tr>
        </table>
      </div>
      <p style="color:#E94560;font-size:13px;">Please log in and change your password immediately.</p>
      ${_btn('Login to Portal', BASE, '#10b981')}
      <p style="color:#94a3b8;font-size:13px;margin-top:24px">Warm regards,<br><strong>IED India HR Team</strong></p>
    `)),

  sendStatusUpdate: (email, name, status) => sendMail(email,
    'Application Update - IED India',
    _wrap(`
      <h2 style="color:#022654;margin-top:0">Application Status Update</h2>
      <p style="color:#475569">Dear <strong>${name}</strong>,</p>
      <p style="color:#475569;line-height:1.7">Your application status: <strong style="color:#03377A;text-transform:uppercase">${status.replace(/_/g, ' ')}</strong></p>
      ${_btn('View Portal', BASE)}
      <p style="color:#94a3b8;font-size:13px;margin-top:24px">Warm regards,<br><strong>IED India HR Team</strong></p>
    `)),
};

module.exports = emailService;
