const nodemailer = require('nodemailer');

const createTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  
  if (user && pass && user !== 'your-email@gmail.com' && pass !== 'your-app-password') {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: { user, pass }
    });
  }
  return null; // Mock mode
};

const sendMail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log(`📧 [MOCK EMAIL] To: ${to} | Subject: ${subject}`);
      return;
    }
    await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
    console.log(`📧 [EMAIL SENT] To: ${to} | Subject: ${subject}`);
  } catch (err) {
    console.error(`❌ [EMAIL ERROR] Failed to send email to ${to}:`, err.message);
    // Gracefully handle error without throwing, preventing app logic crashes
  }
};

const emailService = {
  sendApplicationReceived: (email, name) => sendMail(email, 'Application Received - IED India', `
    <div style="font-family:Arial;padding:20px;background:#f5f5f5">
      <h2 style="color:#1a237e">IED India Internship Portal</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>We have received your internship application. Our HR team will review it and get back to you shortly.</p>
      <p style="color:#666">Thank you for your interest in IED India Pvt Ltd.</p>
      <hr><p style="font-size:12px;color:#999">IED India Pvt Ltd | Internship Management System</p>
    </div>`),

  sendSelectionEmail: (email, name, tempPassword) => sendMail(email, '🎉 Congratulations! You are Selected - IED India', `
    <div style="font-family:Arial;padding:20px;background:#f5f5f5">
      <h2 style="color:#1a237e">IED India Internship Portal</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>🎉 Congratulations! You have been <strong>selected</strong> for the internship at IED India Pvt Ltd.</p>
      <p>Your login credentials:</p>
      <div style="background:#fff;padding:15px;border-radius:8px;border-left:4px solid #1a237e">
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
      </div>
      <p>Please login at <a href="${process.env.CLIENT_URL}">${process.env.CLIENT_URL}</a> and change your password.</p>
      <hr><p style="font-size:12px;color:#999">IED India Pvt Ltd | Internship Management System</p>
    </div>`),

  sendStatusUpdate: (email, name, status) => sendMail(email, `Application Status Update - IED India`, `
    <div style="font-family:Arial;padding:20px;background:#f5f5f5">
      <h2 style="color:#1a237e">IED India Internship Portal</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>Your application status has been updated to: <strong style="color:#1a237e">${status.toUpperCase().replace('_', ' ')}</strong></p>
      <p>Login to your portal to view more details.</p>
      <hr><p style="font-size:12px;color:#999">IED India Pvt Ltd | Internship Management System</p>
    </div>`),

  sendInterviewScheduled: (email, name, interview) => sendMail(email, '📅 Interview Scheduled - IED India', `
    <div style="font-family:Arial;padding:20px;background:#f5f5f5">
      <h2 style="color:#1a237e">IED India Internship Portal</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>Your interview has been scheduled:</p>
      <div style="background:#fff;padding:15px;border-radius:8px;border-left:4px solid #4caf50">
        <p>📅 <strong>Date:</strong> ${new Date(interview.scheduledDate).toDateString()}</p>
        <p>⏰ <strong>Time:</strong> ${interview.time}</p>
        <p>📍 <strong>Mode:</strong> ${interview.mode}</p>
        ${interview.meetLink ? `<p>🔗 <strong>Link:</strong> <a href="${interview.meetLink}">${interview.meetLink}</a></p>` : ''}
      </div>
      <hr><p style="font-size:12px;color:#999">IED India Pvt Ltd | Internship Management System</p>
    </div>`),
};

module.exports = emailService;
