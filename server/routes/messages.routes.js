const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getMessages, sendMessage, getUnreadCount, getConversations } = require('../controllers/messages.controller');
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
        cb(null, `msg_${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`)
    });

const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB limit

// memoryStorage does not set filename — generate it before persistUploads runs
const setFilename = (req, res, next) => {
  if (req.file && !req.file.filename) {
    req.file.filename = `msg_${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`;
  }
  next();
};

router.get('/', protect, getMessages);
router.post('/', protect, upload.single('attachment'), setFilename, persistUploads, sendMessage);
router.get('/unread', protect, getUnreadCount);
router.get('/conversations', protect, getConversations);

module.exports = router;
