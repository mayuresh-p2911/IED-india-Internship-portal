const router = require('express').Router();
const {
  register, login, validateCode,
  getMe, getDashboard, getMyReferrals, getMyCommissions, getMyPayouts, requestPayout,
  getAllPartners, getAllPayouts, updatePayoutStatus, getAllCommissions
} = require('../controllers/referral-partners.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

// Public
router.post('/register', register);
router.post('/login', login);
router.get('/validate-code/:code', validateCode);

// Protected — referral partner
router.get('/me', protect, authorize('referral_partner'), getMe);
router.get('/dashboard', protect, authorize('referral_partner'), getDashboard);
router.get('/referrals', protect, authorize('referral_partner'), getMyReferrals);
router.get('/commissions', protect, authorize('referral_partner'), getMyCommissions);
router.get('/payouts', protect, authorize('referral_partner'), getMyPayouts);
router.post('/payouts/request', protect, authorize('referral_partner'), requestPayout);

// Admin
router.get('/admin/all', protect, authorize('admin'), getAllPartners);
router.get('/admin/payouts', protect, authorize('admin'), getAllPayouts);
router.patch('/admin/payouts/:id', protect, authorize('admin'), updatePayoutStatus);
router.get('/admin/commissions', protect, authorize('admin'), getAllCommissions);

module.exports = router;
