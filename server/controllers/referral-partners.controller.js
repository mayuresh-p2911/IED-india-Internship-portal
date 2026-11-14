const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const ReferralPartner = require('../models/ReferralPartner');
const Commission = require('../models/Commission');
const Payout = require('../models/Payout');
const Application = require('../models/Application');
const emailService = require('../services/email.service');

const generateToken = (id) => jwt.sign(
  { id },
  process.env.JWT_SECRET || 'ied_india_ims_super_secret_jwt_key_2024',
  { expiresIn: process.env.JWT_EXPIRE || '7d' }
);

const generateReferralId = () => {
  const year = new Date().getFullYear();
  const hex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `IED-RP-${year}-${hex}`;
};

const generateReferralCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'IEDP-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const generateUniqueField = async (generator, field) => {
  for (let i = 0; i < 10; i++) {
    const value = generator();
    const exists = await ReferralPartner.findOne({ [field]: value });
    if (!exists) return value;
  }
  const ts = Date.now().toString(36).toUpperCase();
  return field === 'referralId' ? `IED-RP-${new Date().getFullYear()}-${ts}` : `IEDP-${ts.slice(-4)}`;
};

// POST /api/referral-partners/register
const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: (phone || '').trim(),
      role: 'referral_partner'
    });

    const referralId = await generateUniqueField(generateReferralId, 'referralId');
    const referralCode = await generateUniqueField(generateReferralCode, 'referralCode');

    const partner = await ReferralPartner.create({
      userId: user._id,
      referralId,
      referralCode,
      phone: (phone || '').trim()
    });

    const token = generateToken(user._id);

    try {
      await emailService.sendReferralPartnerWelcome(user.email, user.name, referralCode);
    } catch (_) {}

    res.status(201).json({
      success: true,
      token,
      user: user.toJSON(),
      partner: { referralId: partner.referralId, referralCode: partner.referralCode }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/referral-partners/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (user.role !== 'referral_partner') {
      return res.status(403).json({ success: false, message: 'This login is for referral partners only. Please use the main login.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact support.' });
    }

    const partner = await ReferralPartner.findOne({ userId: user._id });
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: user.toJSON(),
      partner: partner ? { referralId: partner.referralId, referralCode: partner.referralCode } : null
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/referral-partners/validate-code/:code
const validateCode = async (req, res) => {
  try {
    const code = (req.params.code || '').trim().toUpperCase();
    if (!code) {
      return res.json({ success: true, valid: false });
    }
    const partner = await ReferralPartner.findOne({ referralCode: code }).populate('userId', 'isActive');
    const valid = partner && partner.userId && partner.userId.isActive;
    res.json({ success: true, valid: !!valid, partnerName: valid ? undefined : undefined });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/referral-partners/me
const getMe = async (req, res) => {
  try {
    const partner = await ReferralPartner.findOne({ userId: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Referral partner profile not found' });
    }
    res.json({ success: true, user: req.user, partner });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/referral-partners/dashboard
const getDashboard = async (req, res) => {
  try {
    const partner = await ReferralPartner.findOne({ userId: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Referral partner profile not found' });
    }

    const pendingPayouts = await Payout.countDocuments({
      referralPartnerId: partner._id,
      status: { $in: ['requested', 'approved', 'processing'] }
    });

    const recentCommissions = await Commission.find({ referralPartnerId: partner._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('-__v');

    const weeklyEarnings = await Commission.aggregate([
      { $match: { referralPartnerId: partner._id } },
      { $group: {
        _id: { weekStart: '$weekStart' },
        total: { $sum: '$commissionAmount' },
        count: { $sum: 1 }
      }},
      { $sort: { '_id.weekStart': -1 } },
      { $limit: 8 }
    ]);

    res.json({
      success: true,
      stats: {
        totalReferred: partner.totalReferred,
        totalEarnings: partner.totalEarnings,
        availableBalance: partner.availableBalance,
        totalPaidOut: partner.totalPaidOut,
        pendingPayouts
      },
      referralCode: partner.referralCode,
      referralId: partner.referralId,
      recentCommissions,
      weeklyEarnings
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/referral-partners/referrals
const getMyReferrals = async (req, res) => {
  try {
    const partner = await ReferralPartner.findOne({ userId: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Referral partner profile not found' });
    }

    const { page = 1, limit = 20 } = req.query;
    const applications = await Application.find({ referralPartnerId: partner._id })
      .select('name email department status payment.amount payment.status createdAt referralCode commissionId')
      .populate('commissionId', 'commissionAmount commissionPercent status')
      .sort({ createdAt: -1 })
      .limit(+limit)
      .skip((+page - 1) * +limit);

    const total = await Application.countDocuments({ referralPartnerId: partner._id });

    res.json({ success: true, referrals: applications, total, pages: Math.ceil(total / +limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/referral-partners/commissions
const getMyCommissions = async (req, res) => {
  try {
    const partner = await ReferralPartner.findOne({ userId: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Referral partner profile not found' });
    }

    const { page = 1, limit = 20, status } = req.query;
    const query = { referralPartnerId: partner._id };
    if (status) query.status = status;

    const commissions = await Commission.find(query)
      .sort({ createdAt: -1 })
      .limit(+limit)
      .skip((+page - 1) * +limit);

    const total = await Commission.countDocuments(query);

    res.json({ success: true, commissions, total, pages: Math.ceil(total / +limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/referral-partners/payouts
const getMyPayouts = async (req, res) => {
  try {
    const partner = await ReferralPartner.findOne({ userId: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Referral partner profile not found' });
    }

    const payouts = await Payout.find({ referralPartnerId: partner._id })
      .sort({ createdAt: -1 })
      .populate('processedBy', 'name');

    res.json({ success: true, payouts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/referral-partners/payouts/request
const requestPayout = async (req, res) => {
  try {
    const partner = await ReferralPartner.findOne({ userId: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Referral partner profile not found' });
    }

    if (partner.availableBalance <= 0) {
      return res.status(400).json({ success: false, message: 'No available balance to request payout' });
    }

    const pendingPayout = await Payout.findOne({
      referralPartnerId: partner._id,
      status: { $in: ['requested', 'approved', 'processing'] }
    });
    if (pendingPayout) {
      return res.status(409).json({ success: false, message: 'You already have a pending payout request. Please wait for it to be processed.' });
    }

    const unpaidCommissions = await Commission.find({
      referralPartnerId: partner._id,
      status: 'confirmed'
    });

    if (unpaidCommissions.length === 0) {
      return res.status(400).json({ success: false, message: 'No confirmed commissions available for payout' });
    }

    const amount = unpaidCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);

    const payout = await Payout.create({
      referralPartnerId: partner._id,
      amount,
      commissions: unpaidCommissions.map(c => c._id),
      status: 'requested',
      requestedAt: new Date()
    });

    await Commission.updateMany(
      { _id: { $in: unpaidCommissions.map(c => c._id) } },
      { status: 'included_in_payout', payoutId: payout._id }
    );

    partner.availableBalance = Math.max(0, partner.availableBalance - amount);
    await partner.save();

    try {
      const admins = await User.find({ role: 'admin', isActive: true }).select('email').limit(3);
      for (const admin of admins) {
        await emailService.sendPayoutRequested(admin.email, req.user.name, amount);
      }
    } catch (_) {}

    res.status(201).json({ success: true, payout, message: 'Payout request submitted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin routes ──

// GET /api/referral-partners/admin/all
const getAllPartners = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    let userIds = null;

    if (search) {
      const users = await User.find({
        role: 'referral_partner',
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      userIds = users.map(u => u._id);
    }

    const query = userIds ? { userId: { $in: userIds } } : {};
    const partners = await ReferralPartner.find(query)
      .populate('userId', 'name email isActive')
      .sort({ createdAt: -1 })
      .limit(+limit)
      .skip((+page - 1) * +limit);

    const total = await ReferralPartner.countDocuments(query);
    res.json({ success: true, partners, total, pages: Math.ceil(total / +limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/referral-partners/admin/payouts
const getAllPayouts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const payouts = await Payout.find(query)
      .populate({
        path: 'referralPartnerId',
        populate: { path: 'userId', select: 'name email' }
      })
      .populate('processedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(+limit)
      .skip((+page - 1) * +limit);

    const total = await Payout.countDocuments(query);
    const statusCounts = await Payout.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({ success: true, payouts, total, pages: Math.ceil(total / +limit), statusCounts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/referral-partners/admin/payouts/:id
const updatePayoutStatus = async (req, res) => {
  try {
    const { status, utrNumber, transactionRef, remarks } = req.body;
    const validStatuses = ['approved', 'processing', 'paid', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const payout = await Payout.findById(req.params.id).populate('referralPartnerId');
    if (!payout) {
      return res.status(404).json({ success: false, message: 'Payout not found' });
    }

    if (payout.status === 'paid') {
      return res.status(400).json({ success: false, message: 'This payout has already been completed' });
    }
    if (payout.status === 'rejected') {
      return res.status(400).json({ success: false, message: 'This payout has been rejected and cannot be updated' });
    }

    const partner = payout.referralPartnerId;

    if (status === 'paid') {
      if (!utrNumber && !transactionRef) {
        return res.status(400).json({ success: false, message: 'UTR number or transaction reference is required to mark as paid' });
      }
      payout.utrNumber = utrNumber || '';
      payout.transactionRef = transactionRef || '';

      await Commission.updateMany(
        { _id: { $in: payout.commissions } },
        { status: 'paid' }
      );

      partner.totalPaidOut = (partner.totalPaidOut || 0) + payout.amount;
      await partner.save();
    }

    if (status === 'rejected') {
      await Commission.updateMany(
        { _id: { $in: payout.commissions } },
        { status: 'confirmed', $unset: { payoutId: '' } }
      );

      partner.availableBalance = (partner.availableBalance || 0) + payout.amount;
      await partner.save();
    }

    payout.status = status;
    payout.processedBy = req.user._id;
    payout.processedAt = new Date();
    if (remarks) payout.remarks = remarks;
    await payout.save();

    try {
      const partnerUser = await User.findById(partner.userId);
      if (partnerUser) {
        await emailService.sendPayoutStatusUpdate(
          partnerUser.email,
          partnerUser.name,
          status,
          payout.amount,
          payout.utrNumber
        );
      }
    } catch (_) {}

    res.json({ success: true, payout, message: `Payout ${status} successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/referral-partners/admin/commissions
const getAllCommissions = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const commissions = await Commission.find(query)
      .populate({
        path: 'referralPartnerId',
        populate: { path: 'userId', select: 'name email' }
      })
      .sort({ createdAt: -1 })
      .limit(+limit)
      .skip((+page - 1) * +limit);

    const total = await Commission.countDocuments(query);
    const totalAmount = await Commission.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
    ]);

    res.json({
      success: true,
      commissions,
      total,
      pages: Math.ceil(total / +limit),
      totalCommissionAmount: totalAmount[0]?.total || 0
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  register, login, validateCode,
  getMe, getDashboard, getMyReferrals, getMyCommissions, getMyPayouts, requestPayout,
  getAllPartners, getAllPayouts, updatePayoutStatus, getAllCommissions
};
