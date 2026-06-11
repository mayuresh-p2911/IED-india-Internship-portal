const router = require('express').Router();
const { getUsers, getUser, createUser, updateUser, deleteUser, getMentors } = require('../controllers/users.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/mentors', protect, getMentors);
router.get('/', protect, getUsers);
router.post('/', protect, authorize('admin'), createUser);
router.get('/:id', protect, getUser);
router.put('/:id', protect, authorize('admin', 'hr'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
