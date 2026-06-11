const router = require('express').Router();
const { getLeaves, applyLeave, updateLeaveStatus } = require('../controllers/leaves.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/', protect, getLeaves);
router.post('/', protect, authorize('intern'), applyLeave);
router.patch('/:id/status', protect, authorize('admin', 'hr', 'mentor'), updateLeaveStatus);

module.exports = router;
