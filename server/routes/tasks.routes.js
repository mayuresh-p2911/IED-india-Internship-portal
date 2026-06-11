const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { getTasks, getTask, createTask, updateTask, submitTask, reviewTask, deleteTask } = require('../controllers/tasks.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const upload = multer({ dest: path.join(__dirname, '../uploads/tasks') });

router.get('/', protect, getTasks);
router.post('/', protect, authorize('admin', 'hr', 'mentor'), createTask);
router.get('/:id', protect, getTask);
router.put('/:id', protect, authorize('admin', 'hr', 'mentor'), updateTask);
router.patch('/:id/submit', protect, authorize('intern'), upload.single('submissionFile'), submitTask);
router.patch('/:id/review', protect, authorize('admin', 'hr', 'mentor'), reviewTask);
router.delete('/:id', protect, authorize('admin', 'mentor'), deleteTask);

module.exports = router;
