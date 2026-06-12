const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { register, login, getMe, updatePassword, updateProfile } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { persistUploads } = require('../middleware/upload.middleware');

const isVercel = !!(process.env.VERCEL || process.env.NODE_ENV === 'production');

const storage = isVercel
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
      },
      filename: (req, file, cb) =>
        cb(null, `profile-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`)
    });

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// memoryStorage does not set filename — generate it before persistUploads runs
const setFilename = (req, res, next) => {
  if (req.file && !req.file.filename) {
    req.file.filename = `profile-${req.user._id}-${Date.now()}${path.extname(req.file.originalname)}`;
  }
  next();
};

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/password', protect, updatePassword);
router.put('/profile', protect, upload.single('photo'), setFilename, persistUploads, updateProfile);

module.exports = router;
