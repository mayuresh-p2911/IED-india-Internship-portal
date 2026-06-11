const router = require('express').Router();
const { getCertificates, generateCertificate, downloadCertificate, verifyCertificate } = require('../controllers/certificates.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/', protect, getCertificates);
router.post('/generate', protect, authorize('admin', 'hr'), generateCertificate);
router.get('/verify/:certNo', verifyCertificate);
router.get('/:id/download', protect, downloadCertificate);

module.exports = router;
