const crypto = require('crypto');
const mongoose = require('mongoose');
const {
  Referral,
  INTERNSHIP_POSITIONS,
  DEPARTMENTS,
  STUDY_YEARS,
  REFERRAL_STATUSES
} = require('../models/Referral');
const User = require('../models/User');
const emailService = require('../services/email.service');

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_DIGITS_REGEX = /^\+?[0-9]{10,15}$/;
const MAX_RESUME_BYTES = 5 * 1024 * 1024;

const isAdminUser = (user) => ['admin', 'superadmin'].includes(user?.role);

const generateUniqueReferralId = async () => {
  const year = new Date().getFullYear();
  for (let i = 0; i < 5; i++) {
    const code = crypto.randomBytes(3).toString('hex').toUpperCase();
    const candidate = `IED-REF-${year}-${code}`;
    const exists = await Referral.exists({ referralId: candidate });
    if (!exists) return candidate;
  }
  return `IED-REF-${year}-${Date.now().toString(36).toUpperCase()}`;
};

const parseSkills = (rawSkills) => {
  if (Array.isArray(rawSkills)) {
    return rawSkills.map((s) => String(s).trim()).filter(Boolean);
  }
  if (typeof rawSkills === 'string') {
    return rawSkills.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

const sanitizeReferral = (doc) => {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  if (obj.resume && obj.resume.data !== undefined) {
    delete obj.resume.data;
  }
  return obj;
};

const sendSafeEmail = async (fn) => {
  try {
    const res = await fn();
    return res || { success: false, error: 'Unknown email error' };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// @desc  Get available internship positions, departments, years, and statuses
// @route GET /api/referrals/meta
const getReferralMetadata = async (req, res) => {
  res.json({
    success: true,
    positions: INTERNSHIP_POSITIONS,
    departments: DEPARTMENTS,
    years: STUDY_YEARS,
    statuses: REFERRAL_STATUSES
  });
};

// @desc  Submit a new intern referral
// @route POST /api/referrals
const submitReferral = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      college,
      department,
      currentYear,
      technicalSkills,
      internshipPosition,
      message = ''
    } = req.body;

    const cleanName = (fullName || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim();
    const normalizedPhone = cleanPhone.replace(/[\s\-()]/g, '');
    const cleanCollege = (college || '').trim();
    const cleanDepartment = (department || '').trim();
    const cleanYear = (currentYear || '').trim();
    const cleanPosition = (internshipPosition || '').trim();
    const cleanMessage = (message || '').trim();
    const skills = parseSkills(technicalSkills);

    // Server-side field validations
    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({ success: false, message: 'Full name is required (at least 2 characters).' });
    }
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }
    if (req.user?.email && cleanEmail === req.user.email.toLowerCase()) {
      return res.status(400).json({ success: false, message: 'You cannot refer yourself.' });
    }
    if (!normalizedPhone || !PHONE_DIGITS_REGEX.test(normalizedPhone)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid phone number (10 to 15 digits).' });
    }
    if (!cleanCollege) {
      return res.status(400).json({ success: false, message: 'College / University is required.' });
    }
    if (!cleanDepartment) {
      return res.status(400).json({ success: false, message: 'Department is required.' });
    }
    if (!cleanYear) {
      return res.status(400).json({ success: false, message: 'Current year of study is required.' });
    }
    if (skills.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide at least one technical skill.' });
    }
    if (!INTERNSHIP_POSITIONS.includes(cleanPosition)) {
      return res.status(400).json({ success: false, message: 'Please select a valid internship position.' });
    }
    if (cleanMessage.length > 1000) {
      return res.status(400).json({ success: false, message: 'Referral message must not exceed 1000 characters.' });
    }

    // Resume PDF validation
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'Resume upload (PDF) is required.' });
    }
    if (req.file.size > MAX_RESUME_BYTES) {
      return res.status(400).json({ success: false, message: 'Resume PDF must be 5MB or smaller.' });
    }
    const isPdfExt = (req.file.originalname || '').toLowerCase().endsWith('.pdf');
    const isPdfMime = req.file.mimetype === 'application/pdf';
    const hasPdfHeader = req.file.buffer.subarray(0, 5).toString('ascii') === '%PDF-';
    if (!isPdfExt || !isPdfMime || !hasPdfHeader) {
      return res.status(400).json({ success: false, message: 'Only valid PDF files are allowed for resume uploads.' });
    }

    // Duplicate prevention: same referred email + same internship position
    const existingDuplicate = await Referral.findOne({
      email: cleanEmail,
      internshipPosition: cleanPosition
    }).select('_id referralId');

    if (existingDuplicate) {
      return res.status(409).json({
        success: false,
        message: `A referral for ${cleanEmail} for "${cleanPosition}" has already been submitted (${existingDuplicate.referralId}).`
      });
    }

    // Check if referred student already has an account (do NOT auto-create)
    const existingUser = await User.findOne({ email: cleanEmail }).select('_id name email');
    const referralId = await generateUniqueReferralId();
    const safeFilename = `${referralId}-${Date.now()}.pdf`;

    const referral = await Referral.create({
      referralId,
      referrer: req.user._id,
      referredUser: existingUser ? existingUser._id : null,
      fullName: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      college: cleanCollege,
      department: cleanDepartment,
      currentYear: cleanYear,
      technicalSkills: skills,
      internshipPosition: cleanPosition,
      message: cleanMessage,
      resume: {
        filename: safeFilename,
        originalName: req.file.originalname,
        contentType: 'application/pdf',
        size: req.file.size,
        data: req.file.buffer
      },
      status: 'Pending Review',
      statusHistory: [
        {
          previousStatus: null,
          newStatus: 'Pending Review',
          updatedBy: req.user._id,
          updatedAt: new Date(),
          remarks: 'Referral submitted'
        }
      ]
    });

    // Send invitation or existing-user notification without failing referral persistence
    const emailPayload = {
      referrerName: req.user.name,
      internshipPosition: cleanPosition,
      referralId,
      message: cleanMessage
    };

    const emailResult = existingUser
      ? await sendSafeEmail(() =>
          emailService.sendReferralExistingUserNotification(cleanEmail, existingUser.name || cleanName, emailPayload)
        )
      : await sendSafeEmail(() =>
          emailService.sendReferralInvitation(cleanEmail, cleanName, emailPayload)
        );

    const populated = await Referral.findById(referral._id)
      .populate('referrer', 'name email department')
      .populate('referredUser', 'name email')
      .populate('statusHistory.updatedBy', 'name role');

    res.status(201).json({
      success: true,
      message: `Referral ${referralId} submitted successfully!`,
      referral: sanitizeReferral(populated),
      existingAccountLinked: Boolean(existingUser),
      emailSent: Boolean(emailResult?.success && !emailResult?.mocked),
      ...(emailResult && !emailResult.success
        ? { emailWarning: `Referral saved, but notification email could not be sent: ${emailResult.error}` }
        : {})
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A duplicate referral for this student and internship position already exists.'
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get referrals submitted by the logged-in user
// @route GET /api/referrals/my
const getMyReferrals = async (req, res) => {
  try {
    const referrals = await Referral.find({ referrer: req.user._id })
      .populate('referredUser', 'name email')
      .populate('statusHistory.updatedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      referrals: referrals.map(sanitizeReferral)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get all referrals (Admin only)
// @route GET /api/referrals
const getAllReferrals = async (req, res) => {
  try {
    const { search, status, internshipPosition, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status && REFERRAL_STATUSES.includes(status)) {
      query.status = status;
    }
    if (internshipPosition && INTERNSHIP_POSITIONS.includes(internshipPosition)) {
      query.internshipPosition = internshipPosition;
    }
    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { fullName: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
        { referralId: { $regex: escaped, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

    const [referrals, total, rawStats] = await Promise.all([
      Referral.find(query)
        .populate('referrer', 'name email department college')
        .populate('referredUser', 'name email')
        .populate('statusHistory.updatedBy', 'name role')
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .sort({ createdAt: -1 }),
      Referral.countDocuments(query),
      Referral.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    ]);

    const stats = {};
    REFERRAL_STATUSES.forEach((s) => { stats[s] = 0; });
    rawStats.forEach((item) => {
      if (stats[item._id] !== undefined) stats[item._id] = item.count;
    });

    res.json({
      success: true,
      referrals: referrals.map(sanitizeReferral),
      total,
      pages: Math.ceil(total / limitNum),
      stats
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single referral detail (owner or admin only)
// @route GET /api/referrals/:id
const getReferralById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid referral ID.' });
    }

    const referral = await Referral.findById(req.params.id)
      .populate('referrer', 'name email department college')
      .populate('referredUser', 'name email')
      .populate('statusHistory.updatedBy', 'name role');

    if (!referral) {
      return res.status(404).json({ success: false, message: 'Referral not found.' });
    }

    const isOwner = referral.referrer?._id?.toString() === req.user._id.toString();
    if (!isAdminUser(req.user) && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this referral.' });
    }

    res.json({ success: true, referral: sanitizeReferral(referral) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Download uploaded PDF resume (owner or admin only)
// @route GET /api/referrals/:id/resume
const downloadReferralResume = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid referral ID.' });
    }

    const referral = await Referral.findById(req.params.id).select('+resume.data');
    if (!referral) {
      return res.status(404).json({ success: false, message: 'Referral not found.' });
    }

    const isOwner = referral.referrer?.toString() === req.user._id.toString();
    if (!isAdminUser(req.user) && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this resume.' });
    }

    if (!referral.resume || !referral.resume.data) {
      return res.status(404).json({ success: false, message: 'Resume file not found.' });
    }

    const safeName = (referral.fullName || 'Candidate').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeName}_${referral.referralId}_Resume.pdf`;

    res.set('Content-Type', referral.resume.contentType || 'application/pdf');
    res.set('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(referral.resume.data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update referral status & remarks (Admin only)
// @route PATCH /api/referrals/:id/status
const updateReferralStatus = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid referral ID.' });
    }

    const { status, remarks = '' } = req.body;
    const cleanStatus = (status || '').trim();
    const cleanRemarks = (remarks || '').trim();

    if (!REFERRAL_STATUSES.includes(cleanStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid referral status.' });
    }
    if (cleanRemarks.length > 1000) {
      return res.status(400).json({ success: false, message: 'Remarks must not exceed 1000 characters.' });
    }

    const referral = await Referral.findById(req.params.id).populate('referrer', 'name email');
    if (!referral) {
      return res.status(404).json({ success: false, message: 'Referral not found.' });
    }

    if (referral.status === cleanStatus) {
      return res.status(400).json({
        success: false,
        message: `Referral status is already "${cleanStatus}". Select a new status to update.`
      });
    }

    const previousStatus = referral.status;
    referral.status = cleanStatus;
    referral.adminRemarks = cleanRemarks;
    referral.statusHistory.push({
      previousStatus,
      newStatus: cleanStatus,
      updatedBy: req.user._id,
      updatedAt: new Date(),
      remarks: cleanRemarks
    });

    await referral.save();

    // Notify both referring user and referred student (non-blocking if SMTP fails)
    const notificationPromises = [
      sendSafeEmail(() =>
        emailService.sendReferralStatusUpdate(referral.email, referral.fullName, {
          referralId: referral.referralId,
          candidateName: referral.fullName,
          internshipPosition: referral.internshipPosition,
          previousStatus,
          newStatus: cleanStatus,
          remarks: cleanRemarks,
          isReferrer: false
        })
      )
    ];

    if (referral.referrer?.email) {
      notificationPromises.push(
        sendSafeEmail(() =>
          emailService.sendReferralStatusUpdate(referral.referrer.email, referral.referrer.name, {
            referralId: referral.referralId,
            candidateName: referral.fullName,
            internshipPosition: referral.internshipPosition,
            previousStatus,
            newStatus: cleanStatus,
            remarks: cleanRemarks,
            isReferrer: true
          })
        )
      );
    }

    const emailResults = await Promise.all(notificationPromises);
    const failedEmails = emailResults.filter((r) => !r.success);

    const populated = await Referral.findById(referral._id)
      .populate('referrer', 'name email department college')
      .populate('referredUser', 'name email')
      .populate('statusHistory.updatedBy', 'name role');

    res.json({
      success: true,
      message: `Referral status updated to "${cleanStatus}".`,
      referral: sanitizeReferral(populated),
      emailSent: failedEmails.length === 0 && emailResults.every((r) => !r.mocked),
      ...(failedEmails.length > 0
        ? { emailWarning: `Status updated, but one or more notification emails failed: ${failedEmails.map((f) => f.error).join('; ')}` }
        : {})
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getReferralMetadata,
  submitReferral,
  getMyReferrals,
  getAllReferrals,
  getReferralById,
  downloadReferralResume,
  updateReferralStatus
};

