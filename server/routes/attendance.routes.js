const router = require('express').Router();
const { getAttendance, markAttendance, getTodayStatus, getReport, updateAttendance } = require('../controllers/attendance.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/', protect, getAttendance);
router.post('/mark', protect, authorize('intern'), markAttendance);
router.get('/today', protect, getTodayStatus);
router.get('/report', protect, getReport);
router.put('/:id', protect, authorize('admin', 'hr'), updateAttendance);

module.exports = router;
