const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { getTasks, getTask, createTask, updateTask, submitTask, reviewTask, deleteTask } = require('../controllers/tasks.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const fs = require('fs');
const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';

const storage = isVercel
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/tasks');
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
    });

const setFilename = (req, res, next) => {
  if (req.file && !req.file.filename) {
    req.file.filename = `${Date.now()}-${req.file.originalname}`;
  }
  next();
};

const upload = multer({ storage });

const { persistUploads } = require('../middleware/upload.middleware');

router.get('/', protect, getTasks);
router.post('/', protect, authorize('admin', 'hr', 'mentor'), createTask);
router.get('/:id', protect, getTask);
router.put('/:id', protect, authorize('admin', 'hr', 'mentor'), updateTask);
router.patch('/:id/submit', protect, authorize('intern'), upload.single('submissionFile'), setFilename, persistUploads, submitTask);
router.patch('/:id/review', protect, authorize('admin', 'hr', 'mentor'), reviewTask);
router.delete('/:id', protect, authorize('admin', 'mentor'), deleteTask);

module.exports = router;
