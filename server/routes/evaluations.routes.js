const router = require('express').Router();
const { getEvaluations, getEvaluation, createEvaluation, updateEvaluation, getInternProgress } = require('../controllers/evaluations.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/', protect, getEvaluations);
router.post('/', protect, authorize('admin', 'mentor'), createEvaluation);
router.get('/progress/:internId', protect, getInternProgress);
router.get('/:id', protect, getEvaluation);
router.put('/:id', protect, authorize('admin', 'mentor'), updateEvaluation);

module.exports = router;
