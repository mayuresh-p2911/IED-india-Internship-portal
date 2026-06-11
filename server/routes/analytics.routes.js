const router = require('express').Router();
const { getSummary, getMentorStats, getInternStats } = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/summary', protect, authorize('admin', 'hr'), getSummary);
router.get('/mentor', protect, authorize('admin', 'mentor'), getMentorStats);
router.get('/intern', protect, authorize('intern'), getInternStats);

module.exports = router;
