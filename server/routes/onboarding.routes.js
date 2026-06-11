const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { getOnboarding, getOnboardingById, getMyOnboarding, updateOnboarding } = require('../controllers/onboarding.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const os = require('os');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';
    const uploadDir = isVercel ? path.join(os.tmpdir(), 'onboarding') : path.join(__dirname, '../uploads/onboarding');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', protect, authorize('admin', 'hr'), getOnboarding);
router.get('/me', protect, authorize('intern'), getMyOnboarding);
router.get('/:id', protect, getOnboardingById);
router.put('/:id', protect, upload.fields([
  { name: 'agreement', maxCount: 1 }, { name: 'documents.resume', maxCount: 1 },
  { name: 'documents.aadhaar', maxCount: 1 }, { name: 'documents.collegeId', maxCount: 1 },
  { name: 'documents.photo', maxCount: 1 }
]), updateOnboarding);

module.exports = router;
