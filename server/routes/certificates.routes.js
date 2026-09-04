const router = require('express').Router();
const { getCertificates, generateCertificate, downloadCertificate, verifyCertificate } = require('../controllers/certificates.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/', protect, getCertificates);
// Allow interns, HR, and admins to generate certificates
router.post('/generate', protect, authorize('admin', 'hr', 'superadmin', 'intern'), generateCertificate);
router.get('/verify/:certNo', verifyCertificate);
router.get('/:id/download', protect, downloadCertificate);

module.exports = router;
