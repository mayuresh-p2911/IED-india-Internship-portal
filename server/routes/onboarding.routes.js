const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getOnboarding, getOnboardingById, getMyOnboarding, updateOnboarding } = require('../controllers/onboarding.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { persistUploads } = require('../middleware/upload.middleware');

const isVercel = !!(process.env.VERCEL || process.env.NODE_ENV === 'production');

const storage = isVercel
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/onboarding');
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
    });

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// memoryStorage does not set filename — generate it before persistUploads runs
const setFilenames = (req, res, next) => {
  if (req.files) {
    for (const field of Object.keys(req.files)) {
      for (const file of req.files[field]) {
        if (!file.filename) file.filename = `${Date.now()}-${file.originalname}`;
      }
    }
  }
  next();
};

router.get('/', protect, authorize('admin', 'hr'), getOnboarding);
router.get('/me', protect, authorize('intern'), getMyOnboarding);
router.get('/:id', protect, getOnboardingById);
router.put('/:id', protect, upload.fields([
  { name: 'agreement', maxCount: 1 }, { name: 'documents.resume', maxCount: 1 },
  { name: 'documents.aadhaar', maxCount: 1 }, { name: 'documents.collegeId', maxCount: 1 },
  { name: 'documents.photo', maxCount: 1 }
]), setFilenames, persistUploads, updateOnboarding);

module.exports = router;
