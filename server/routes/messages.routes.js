const router = require('express').Router();
const { getMessages, sendMessage, getUnreadCount, getConversations } = require('../controllers/messages.controller');
const { protect } = require('../middleware/auth.middleware');

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `msg_${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`)
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB limit

router.get('/', protect, getMessages);
router.post('/', protect, upload.single('attachment'), sendMessage);
router.get('/unread', protect, getUnreadCount);
router.get('/conversations', protect, getConversations);

module.exports = router;
