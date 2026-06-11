const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { register, login, getMe, updatePassword, updateProfile } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const fs = require('fs');
const os = require('os');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';
    const uploadDir = isVercel ? path.join(os.tmpdir(), 'profile') : path.join(__dirname, '../uploads');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => cb(null, `profile-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const { persistUploads } = require('../middleware/upload.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/password', protect, updatePassword);
router.put('/profile', protect, upload.single('photo'), persistUploads, updateProfile);

module.exports = router;

