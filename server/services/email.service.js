/**
 * IED India — Email Service
 * Supports both Resend API (HTTPS, recommended for Vercel)
 * and Nodemailer SMTP (recommended for local testing or custom mail servers).
 */
const nodemailer = require('nodemailer');
const https = require('https');

const BASE = process.env.NODE_ENV === 'development'
  ? (process.env.CLIENT_URL || 'http://localhost:5000')
  : 'https://ied-india-internship-portal.vercel.app';
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// ── Resend API Helper ─────────────────────────────────────────
const sendViaResend = (to, subject, html) => {
  return new Promise((resolve) => {
    const fromAddress = process.env.EMAIL_FROM || 'IED India <onboarding@resend.dev>';
    const body = JSON.stringify({
      from: fromAddress,
      to: [to],
      subject,
      html
    });

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
          console.log(`📧 [EMAIL SENT via Resend] To: ${to} | Subject: ${subject}`);
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ success: true });
          }
        } else {
          console.error(`❌ [EMAIL ERROR via Resend] Status ${res.statusCode} | To: ${to}`);
          console.error('   Response:', data);
          resolve({ success: false, error: `Resend API returned status ${res.statusCode}`, response: data });
        }
      });
    });

    req.on('error', (err) => {
      console.error(`❌ [EMAIL ERROR via Resend] To: ${to} | ${err.message}`);
      resolve({ success: false, error: err.message });
    });

    req.write(body);
    req.end();
  });
};

// ── SMTP Helper ──────────────────────────────────────────────
const sendViaSMTP = async (to, subject, html, user, pass) => {
  try {
    const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.EMAIL_PORT) || 465;

    // Use official service: 'gmail' configuration if email is @gmail.com or host is gmail.com
    const isGmail = user.toLowerCase().endsWith('@gmail.com') || host.toLowerCase().includes('gmail.com');

    const transporterConfig = isGmail
      ? {
          service: 'gmail',
          auth: { user, pass },
          tls: { rejectUnauthorized: false }
        }
      : {
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
          tls: { rejectUnauthorized: false },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
        };

    const transporter = nodemailer.createTransport(transporterConfig);

    const fromName = process.env.EMAIL_FROM_NAME || 'IED India';
    const from = `"${fromName}" <${user}>`;

    const info = await transporter.sendMail({ from, to, subject, html });
    console.log(`📧 [EMAIL SENT via SMTP] To: ${to} | Subject: ${subject} | MsgId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ [EMAIL ERROR via SMTP] To: ${to} | Subject: ${subject}`);
    console.error('   code:', err.code, '| msg:', err.message);
    if (err.response) console.error('   SMTP Response:', err.response);
    return { success: false, error: err.message, code: err.code, response: err.response };
  }
};

// ── Core send function ──────────────────────────────────────
const sendMail = async (to, subject, html) => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  // 1. Prioritise SMTP (Gmail) if user credentials are set
  if (user && pass && user !== 'your-gmail@gmail.com' && pass !== 'your-16-char-app-password') {
    const result = await sendViaSMTP(to, subject, html, user, pass);
    if (result.success) return result;

    // Fallback: If SMTP failed but Resend API key is configured, try Resend API
    if (RESEND_API_KEY && RESEND_API_KEY !== 'your-resend-api-key') {
      console.log('🔄 SMTP failed. Trying fallback to Resend API...');
      return sendViaResend(to, subject, html);
    }
    return result;
  }

  // 2. Fallback to Resend API if API Key is set
  if (RESEND_API_KEY && RESEND_API_KEY !== 'your-resend-api-key') {
    return sendViaResend(to, subject, html);
  }

  // 3. Fallback: Mock mode
  console.log(`📧 [MOCK EMAIL] To: ${to} | Subject: ${subject}`);
  console.log('   → Set EMAIL_USER/EMAIL_PASS (SMTP) or RESEND_API_KEY (HTTP) in env variables to send real emails.');
  return { success: true, mocked: true };
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
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px;width:120px">Date</td><td style="padding:8px 0;color:#0f172a;font-weight:600">${interview.scheduledAt ? new Date(interview.scheduledAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : (interview.scheduledDate ? new Date(interview.scheduledDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'To be confirmed')}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Time</td><td style="padding:8px 0;color:#0f172a;font-weight:600">${interview.scheduledAt ? new Date(interview.scheduledAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }) : (interview.time || 'To be confirmed')}</td></tr>
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
