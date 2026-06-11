const router = require('express').Router();
const { getMessages, sendMessage, getUnreadCount, getConversations } = require('../controllers/messages.controller');
const { protect } = require('../middleware/auth.middleware');

const multer = require('multer');
const path = require('path');

const os = require('os');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';
    const uploadDir = isVercel ? path.join(os.tmpdir(), 'messages') : path.join(__dirname, '../uploads');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => cb(null, `msg_${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`)
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB limit

router.get('/', protect, getMessages);
router.post('/', protect, upload.single('attachment'), sendMessage);
router.get('/unread', protect, getUnreadCount);
router.get('/conversations', protect, getConversations);

module.exports = router;
