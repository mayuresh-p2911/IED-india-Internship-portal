const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { getApplications, getApplication, submitApplication, updateStatus, deleteApplication } = require('../controllers/applications.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/applications')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', protect, authorize('admin', 'hr', 'mentor'), getApplications);
router.post('/', upload.fields([{ name: 'resume', maxCount: 1 }, { name: 'photo', maxCount: 1 }]), submitApplication);
router.get('/:id', protect, getApplication);
router.patch('/:id/status', protect, authorize('admin', 'hr'), updateStatus);
router.delete('/:id', protect, authorize('admin'), deleteApplication);

module.exports = router;
