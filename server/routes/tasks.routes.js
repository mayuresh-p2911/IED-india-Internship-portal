const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { getTasks, getTask, createTask, updateTask, submitTask, reviewTask, deleteTask } = require('../controllers/tasks.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const os = require('os');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';
    const uploadDir = isVercel ? path.join(os.tmpdir(), 'tasks') : path.join(__dirname, '../uploads/tasks');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

router.get('/', protect, getTasks);
router.post('/', protect, authorize('admin', 'hr', 'mentor'), createTask);
router.get('/:id', protect, getTask);
router.put('/:id', protect, authorize('admin', 'hr', 'mentor'), updateTask);
router.patch('/:id/submit', protect, authorize('intern'), upload.single('submissionFile'), submitTask);
router.patch('/:id/review', protect, authorize('admin', 'hr', 'mentor'), reviewTask);
router.delete('/:id', protect, authorize('admin', 'mentor'), deleteTask);

module.exports = router;
