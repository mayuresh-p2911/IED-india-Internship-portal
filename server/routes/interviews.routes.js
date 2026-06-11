const router = require('express').Router();
const { getInterviews, getInterview, scheduleInterview, updateInterview, deleteInterview } = require('../controllers/interviews.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/', protect, getInterviews);
router.post('/', protect, authorize('admin', 'hr'), scheduleInterview);
router.get('/:id', protect, getInterview);
router.put('/:id', protect, authorize('admin', 'hr'), updateInterview);
router.delete('/:id', protect, authorize('admin', 'hr'), deleteInterview);

module.exports = router;
