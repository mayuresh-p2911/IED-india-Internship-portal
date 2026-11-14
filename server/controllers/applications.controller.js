const Application = require('../models/Application');
const User = require('../models/User');
const Onboarding = require('../models/Onboarding');
const PricingConfig = require('../models/PricingConfig');
const ReferralPartner = require('../models/ReferralPartner');
const Commission = require('../models/Commission');
const emailService = require('../services/email.service');
const razorpayService = require('../services/razorpay.service');

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

// @desc  Get public Razorpay payment configuration for internship applications
// @route GET /api/applications/payment-config
const getPaymentConfig = async (req, res) => {
  const cfg = razorpayService.getConfig();
  const { department } = req.query;

  let dbFee = null;
  try {
    if (department) {
      const deptConfig = await PricingConfig.findOne({ department, isActive: true });
      if (deptConfig) dbFee = deptConfig.applicationFee;
    }
    if (dbFee === null) {
      const defaultConfig = await PricingConfig.findOne({ department: null, isActive: true });
      if (defaultConfig) dbFee = defaultConfig.applicationFee;
    }
  } catch (_) {}

  res.json({
    success: true,
    enabled: cfg.isConfigured,
    keyId: cfg.isConfigured ? cfg.keyId : '',
    amountInr: dbFee !== null ? dbFee : cfg.feeInr,
    currency: cfg.currency
  });
};

// @desc  Create Razorpay order prior to application submission
// @route POST /api/applications/create-order
const createApplicationOrder = async (req, res) => {
  try {
    const cfg = razorpayService.getConfig();
    if (!cfg.isConfigured) {
      return res.status(503).json({ success: false, message: 'Payment gateway is not configured.' });
    }

    const { name, email, phone, department } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Name, email, and phone are required before initiating payment.' });
    }

    let amountInr = null;
    try {
      if (department) {
        const deptConfig = await PricingConfig.findOne({ department, isActive: true });
        if (deptConfig) amountInr = deptConfig.applicationFee;
      }
      if (amountInr === null) {
        const defaultConfig = await PricingConfig.findOne({ department: null, isActive: true });
        if (defaultConfig) amountInr = defaultConfig.applicationFee;
      }
    } catch (_) {}

    const order = await razorpayService.createOrder({
      receipt: `ied_app_${Date.now()}`,
      notes: {
        applicantName: String(name).trim().slice(0, 80),
        applicantEmail: String(email).trim().toLowerCase().slice(0, 80),
        department: String(department || '').trim().slice(0, 80)
      },
      amountInr
    });

    res.json({ success: true, ...order });
  } catch (err) {
    console.error('[ERROR] createApplicationOrder:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Failed to create payment order.' });
  }
};

// @desc  Submit new application (public, with Razorpay payment verification)
// @route POST /api/applications
const submitApplication = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      ...restBody
    } = req.body;

    const cfg = razorpayService.getConfig();
    let paymentData;

    if (cfg.isConfigured) {
      const orderId = (razorpay_order_id || '').trim();
      const paymentId = (razorpay_payment_id || '').trim();
      const signature = (razorpay_signature || '').trim();

      if (!orderId || !paymentId || !signature) {
        return res.status(400).json({
          success: false,
          message: 'Application fee payment is required before submitting.'
        });
      }

      const isValid = razorpayService.verifySignature({ orderId, paymentId, signature });
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Payment verification failed. Invalid Razorpay signature.'
        });
      }

      const existingPayment = await Application.findOne({ 'payment.paymentId': paymentId }).select('_id');
      if (existingPayment) {
        return res.status(409).json({
          success: false,
          message: 'This payment has already been used for an application.'
        });
      }

      paymentData = {
        orderId,
        paymentId,
        signature,
        amount: cfg.feeInr,
        currency: cfg.currency,
        status: 'paid',
        paidAt: new Date()
      };
    }

    const data = { ...restBody };
    if (paymentData) data.payment = paymentData;

    if (req.files) {
      if (req.files.resume) data.resume = `/uploads/applications/${req.files.resume[0].filename}`;
      if (req.files.photo) data.photo = `/uploads/applications/${req.files.photo[0].filename}`;
    }

    // Referral code attribution (only after successful payment verification)
    const submittedReferralCode = (restBody.referralCode || '').trim().toUpperCase();
    if (submittedReferralCode && paymentData) {
      try {
        const partner = await ReferralPartner.findOne({ referralCode: submittedReferralCode })
          .populate('userId', 'email name');
        if (partner && partner.userId && partner.userId.email !== (restBody.email || '').toLowerCase().trim()) {
          let pricingConfig = await PricingConfig.findOne({ department: restBody.department, isActive: true });
          if (!pricingConfig) pricingConfig = await PricingConfig.findOne({ department: null, isActive: true });
          const commissionPercent = pricingConfig ? pricingConfig.commissionPercent : 10;
          const commissionAmount = Math.round((paymentData.amount * commissionPercent / 100) * 100) / 100;

          const now = new Date();
          const dayOfWeek = now.getDay();
          const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() + mondayOffset);
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);

          const commission = await Commission.create({
            referralPartnerId: partner._id,
            applicationId: null,
            studentName: restBody.name || '',
            studentEmail: (restBody.email || '').toLowerCase(),
            applicationFee: paymentData.amount,
            commissionPercent,
            commissionAmount,
            razorpayPaymentId: paymentData.paymentId || '',
            status: 'confirmed',
            weekStart,
            weekEnd,
            confirmedAt: new Date()
          });

          data.referralCode = submittedReferralCode;
          data.referralPartnerId = partner._id;
          data.commissionId = commission._id;

          partner.totalReferred = (partner.totalReferred || 0) + 1;
          partner.totalEarnings = (partner.totalEarnings || 0) + commissionAmount;
          partner.availableBalance = (partner.availableBalance || 0) + commissionAmount;
          await partner.save();

          // Update commission with applicationId after creation below
          data._pendingCommissionId = commission._id;

          try {
            await emailService.sendCommissionEarned(
              partner.userId.email, partner.userId.name,
              restBody.name || 'A student', commissionAmount
            );
          } catch (_) {}
        }
      } catch (refErr) {
        console.warn('[WARN] Referral attribution failed (non-blocking):', refErr.message);
      }
    }

    const application = await Application.create(data);

    // Link commission to the created application
    if (data._pendingCommissionId) {
      try {
        await Commission.findByIdAndUpdate(data._pendingCommissionId, { applicationId: application._id });
      } catch (_) {}
    }

    const emailResult = await emailService.sendApplicationReceived(
      application.email,
      application.name,
      application.payment
    );
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      application: normalizeAppPaths(application),
      emailSent: Boolean(emailResult?.success && !emailResult?.mocked),
      ...(emailResult?.success ? {} : { emailError: emailResult?.error || 'Email delivery failed' })
    });
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

    let emailResult = null;

    // ── Handle each status transition ──────────────────────
    if (status === 'shortlisted') {
      // Notify applicant they've been shortlisted
      emailResult = await emailService.sendShortlisted(application.email, application.name);

    } else if (status === 'rejected') {
      // Send rejection email with optional reason
      emailResult = await emailService.sendApplicationRejected(application.email, application.name, rejectionReason || notes || '');

    } else if (status === 'selected') {
      // Intern accepted after interview — create account + send credentials
      if (!application.internId) {
        const tempPassword = generateInternPassword(application.name);
        let internId;
        // Check if User already exists with this email
        let existingUser = await User.findOne({ email: application.email.toLowerCase() });
        if (existingUser) {
          // Update existing user credentials and role
          existingUser.role = 'intern';
          existingUser.password = tempPassword;
          existingUser.phone = existingUser.phone || application.phone || '';
          existingUser.college = existingUser.college || application.college || '';
          existingUser.department = existingUser.department || application.department || '';
          existingUser.internshipStart = new Date();
          existingUser.internshipEnd = new Date(Date.now() + (application.duration || 8) * 7 * 24 * 3600 * 1000);
          await existingUser.save();

          internId = existingUser._id;
        } else {
          // Create brand new user
          const newUser = await User.create({
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
          internId = newUser._id;
        }
        application.internId = internId;
        await application.save();

        // Send welcome email with login credentials
        emailResult = await emailService.sendSelectionEmail(application.email, application.name, tempPassword);
        const welcomeSent = Boolean(emailResult?.success && !emailResult?.mocked);

        // Create onboarding record if it doesn't exist yet
        const existingOnboarding = await Onboarding.findOne({ internId });
        if (!existingOnboarding) {
          await Onboarding.create({ internId, applicationId: application._id, welcomeEmailSent: welcomeSent });
        } else if (welcomeSent && !existingOnboarding.welcomeEmailSent) {
          existingOnboarding.welcomeEmailSent = true;
          await existingOnboarding.save();
        }
      } else {
        emailResult = await emailService.sendSelectionEmail(
          application.email,
          application.name,
          '[Check your original email for credentials]'
        );
        if (emailResult?.success && !emailResult?.mocked) {
          await Onboarding.updateOne({ internId: application.internId }, { welcomeEmailSent: true });
        }
      }
    } else {
      // Generic status update (on_hold, interview_scheduled, etc.)
      emailResult = await emailService.sendStatusUpdate(application.email, application.name, status);
    }

    res.json({
      success: true,
      application: normalizeAppPaths(application),
      emailSent: Boolean(emailResult?.success && !emailResult?.mocked),
      ...(emailResult && !emailResult.success ? { emailError: emailResult.error || 'Email delivery failed' } : {})
    });
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

module.exports = { getApplications, getApplication, getPaymentConfig, createApplicationOrder, submitApplication, updateStatus, deleteApplication };
