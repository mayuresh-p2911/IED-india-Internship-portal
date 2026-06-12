const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getApplications, getApplication, submitApplication, updateStatus, deleteApplication } = require('../controllers/applications.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { persistUploads } = require('../middleware/upload.middleware');

const isVercel = !!(process.env.VERCEL || process.env.NODE_ENV === 'production');

const storage = isVercel
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/applications');
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
    });

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

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

router.get('/', protect, authorize('admin', 'hr', 'mentor'), getApplications);
router.post('/', upload.fields([{ name: 'resume', maxCount: 1 }, { name: 'photo', maxCount: 1 }]), setFilenames, persistUploads, submitApplication);
router.get('/:id', protect, getApplication);
router.patch('/:id/status', protect, authorize('admin', 'hr'), updateStatus);
router.delete('/:id', protect, authorize('admin'), deleteApplication);

module.exports = router;
