const router = require('express').Router();
const multer = require('multer');
const {
  getReferralMetadata,
  submitReferral,
  getMyReferrals,
  getAllReferrals,
  getReferralById,
  downloadReferralResume,
  updateReferralStatus
} = require('../controllers/referrals.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const isPdfExt = (file.originalname || '').toLowerCase().endsWith('.pdf');
    const isPdfMime = file.mimetype === 'application/pdf';
    if (!isPdfExt || !isPdfMime) {
      return cb(new Error('Only PDF files are allowed for resume upload.'));
    }
    cb(null, true);
  }
});

const handleResumeUpload = (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err) {
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'Resume file size must not exceed 5MB.'
        : (err.message || 'Invalid resume upload.');
      return res.status(400).json({ success: false, message });
    }
    next();
  });
};

router.get('/meta', protect, getReferralMetadata);
router.get('/my', protect, getMyReferrals);
router.get('/', protect, authorize('admin'), getAllReferrals);
router.post('/', protect, handleResumeUpload, submitReferral);
router.get('/:id', protect, getReferralById);
router.get('/:id/resume', protect, downloadReferralResume);
router.patch('/:id/status', protect, authorize('admin'), updateReferralStatus);

module.exports = router;

