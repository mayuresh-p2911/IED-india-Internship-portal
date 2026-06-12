const Interview = require('../models/Interview');
const Application = require('../models/Application');
const User = require('../models/User');
const Onboarding = require('../models/Onboarding');
const emailService = require('../services/email.service');

// Generate intern password: first 3 letters of name + 3 random digits + special symbol
const generateInternPassword = (name) => {
  const prefix = (name || 'INT').replace(/[^a-zA-Z]/g, '').slice(0, 3).toLowerCase();
  const digits = Math.floor(100 + Math.random() * 900);
  const symbols = ['@', '#', '$', '!', '&', '*'];
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  return prefix.charAt(0).toUpperCase() + prefix.slice(1) + digits + symbol;
};

const getInterviews = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const interviews = await Interview.find(query)
      .populate('applicationId')
      .populate('interviewedBy', 'name email')
      .limit(+limit).skip((+page - 1) * +limit)
      .sort({ scheduledAt: 1 });
    const total = await Interview.countDocuments(query);
    res.json({ success: true, interviews, total });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('applicationId')
      .populate('interviewedBy', 'name');
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
    res.json({ success: true, interview });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const scheduleInterview = async (req, res) => {
  try {
    const interview = await Interview.create({ ...req.body, interviewedBy: req.user._id });
    // Update application status
    await Application.findByIdAndUpdate(req.body.applicationId, { status: 'interview_scheduled' });
    const app = await Application.findById(req.body.applicationId);
    if (app) await emailService.sendInterviewScheduled(app.email, app.name, interview);
    res.status(201).json({ success: true, interview });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const updateInterview = async (req, res) => {
  try {
    const { acceptIntern, rejectIntern, rejectionReason, ...updateFields } = req.body;
    const interview = await Interview.findByIdAndUpdate(req.params.id, updateFields, { new: true })
      .populate('applicationId');
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });

    const app = interview.applicationId;

    // ── Accept intern after interview ─────────────────────
    if (acceptIntern && app) {
      const existingApp = await Application.findById(app._id);
      if (existingApp && !existingApp.internId) {
        const tempPassword = generateInternPassword(app.name);
        const intern = await User.create({
          name: app.name,
          email: app.email,
          phone: app.phone || '',
          college: app.college || '',
          department: app.department || '',
          role: 'intern',
          password: tempPassword,
          internshipStart: new Date(),
          internshipEnd: new Date(Date.now() + (existingApp.duration || 8) * 7 * 24 * 3600 * 1000)
        });
        existingApp.internId = intern._id;
        existingApp.status = 'selected';
        await existingApp.save();
        await Onboarding.create({ internId: intern._id, applicationId: app._id });
        await emailService.sendSelectionEmail(app.email, app.name, tempPassword);
      } else if (existingApp) {
        // Already has internId — just update status and resend welcome if needed
        existingApp.status = 'selected';
        await existingApp.save();
        await emailService.sendSelectionEmail(app.email, app.name, '[Check your original email for credentials]');
      }
    }

    // ── Reject intern after interview ─────────────────────
    if (rejectIntern && app) {
      await Application.findByIdAndUpdate(app._id, { status: 'rejected' });
      await emailService.sendInterviewRejected(app.email, app.name, rejectionReason || '');
    }

    // ── If interview rescheduled → send updated schedule email ──
    if (updateFields.scheduledAt && !acceptIntern && !rejectIntern && app) {
      await emailService.sendInterviewScheduled(app.email, app.name, interview);
    }

    res.json({ success: true, interview });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const deleteInterview = async (req, res) => {
  try {
    await Interview.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Interview deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getInterviews, getInterview, scheduleInterview, updateInterview, deleteInterview };
