const Application = require('../models/Application');
const User = require('../models/User');
const Onboarding = require('../models/Onboarding');
const emailService = require('../services/email.service');

const normalizeAppPaths = (app) => {
  if (!app) return app;
  const doc = app.toObject ? app.toObject() : app;
  if (doc.resume) {
    const norm = doc.resume.replace(/\\/g, '/');
    const idx = norm.indexOf('/uploads/');
    if (idx !== -1) doc.resume = norm.substring(idx);
    else if (norm.includes('uploads/')) doc.resume = '/' + norm.substring(norm.indexOf('uploads/'));
  }
  if (doc.photo) {
    const norm = doc.photo.replace(/\\/g, '/');
    const idx = norm.indexOf('/uploads/');
    if (idx !== -1) doc.photo = norm.substring(idx);
    else if (norm.includes('uploads/')) doc.photo = '/' + norm.substring(norm.indexOf('uploads/'));
  }
  return doc;
};

// Generate intern password: first 3 letters of name + 3 random digits + special symbol
const generateInternPassword = (name) => {
  const prefix = (name || 'INT').replace(/[^a-zA-Z]/g, '').slice(0, 3).toLowerCase();
  const digits = Math.floor(100 + Math.random() * 900); // 3 digits: 100-999
  const symbols = ['@', '#', '$', '!', '&', '*'];
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  // Capitalise first letter to meet common password rules
  return prefix.charAt(0).toUpperCase() + prefix.slice(1) + digits + symbol;
};

// @desc  Get all applications
// @route GET /api/applications
const getApplications = async (req, res) => {
  try {
    const { status, department, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (department) query.department = department;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { college: { $regex: search, $options: 'i' } }
    ];
    const applications = await Application.find(query)
      .populate('reviewedBy', 'name')
      .limit(+limit).skip((+page - 1) * +limit)
      .sort({ createdAt: -1 });
    const total = await Application.countDocuments(query);
    const stats = await Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    res.json({ success: true, applications: applications.map(normalizeAppPaths), total, pages: Math.ceil(total / +limit), stats });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// @desc  Get single application
// @route GET /api/applications/:id
const getApplication = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id)
      .populate('reviewedBy', 'name email')
      .populate('internId', 'name email');
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, application: normalizeAppPaths(app) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// @desc  Submit new application (public)
// @route POST /api/applications
const submitApplication = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.files) {
      if (req.files.resume) data.resume = `/uploads/applications/${req.files.resume[0].filename}`;
      if (req.files.photo)  data.photo  = `/uploads/applications/${req.files.photo[0].filename}`;
    }
    const application = await Application.create(data);
    await emailService.sendApplicationReceived(application.email, application.name);
    res.status(201).json({ success: true, message: 'Application submitted successfully!', application: normalizeAppPaths(application) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// @desc  Update application status
// @route PATCH /api/applications/:id/status
const updateStatus = async (req, res) => {
  try {
    const { status, notes, rejectionReason } = req.body;
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status, notes: notes || rejectionReason, reviewedBy: req.user._id },
      { new: true }
    );
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    // ── Handle each status transition ──────────────────────
    if (status === 'shortlisted') {
      // Notify applicant they've been shortlisted
      emailService.sendShortlisted(application.email, application.name);

    } else if (status === 'rejected') {
      // Send rejection email with optional reason
      emailService.sendApplicationRejected(application.email, application.name, rejectionReason || notes || '');

    } else if (status === 'selected') {
      // Intern accepted after interview — create account + send credentials
      if (!application.internId) {
        const tempPassword = generateInternPassword(application.name);
        const intern = await User.create({
          name: application.name,
          email: application.email,
          phone: application.phone || '',
          college: application.college || '',
          department: application.department || '',
          role: 'intern',
          password: tempPassword,
          internshipStart: new Date(),
          internshipEnd: new Date(Date.now() + (application.duration || 8) * 7 * 24 * 3600 * 1000)
        });
        application.internId = intern._id;
        await application.save();
        // Create onboarding record
        await Onboarding.create({ internId: intern._id, applicationId: application._id });
        // Send welcome email with login credentials
        await emailService.sendSelectionEmail(application.email, application.name, tempPassword);
      }
    } else {
      // Generic status update (on_hold, interview_scheduled, etc.)
      emailService.sendStatusUpdate(application.email, application.name, status);
    }

    res.json({ success: true, application: normalizeAppPaths(application) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// @desc  Delete application
// @route DELETE /api/applications/:id
const deleteApplication = async (req, res) => {
  try {
    await Application.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Application deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getApplications, getApplication, submitApplication, updateStatus, deleteApplication };
