const router = require('express').Router();
const { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } = require('../controllers/announcements.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/', protect, getAnnouncements);
router.post('/', protect, authorize('admin', 'hr'), createAnnouncement);
router.put('/:id', protect, authorize('admin', 'hr'), updateAnnouncement);
router.delete('/:id', protect, authorize('admin', 'hr'), deleteAnnouncement);

module.exports = router;
