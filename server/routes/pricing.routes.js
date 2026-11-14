const router = require('express').Router();
const { getPublicPricingConfig, getAdminPricingConfigs, updatePricingConfig } = require('../controllers/pricing.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/config', getPublicPricingConfig);
router.get('/admin', protect, authorize('admin'), getAdminPricingConfigs);
router.put('/', protect, authorize('admin'), updatePricingConfig);

module.exports = router;
