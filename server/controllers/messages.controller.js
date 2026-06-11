const Message = require('../models/Message');

const getMessages = async (req, res) => {
  try {
    const { withUser } = req.query;
    const me = req.user._id;
    const query = withUser
      ? { $or: [{ senderId: me, receiverId: withUser }, { senderId: withUser, receiverId: me }] }
      : { $or: [{ senderId: me }, { receiverId: me }] };
    const messages = await Message.find(query).populate('senderId', 'name photo role').populate('receiverId', 'name photo role').sort({ createdAt: 1 });
    // Mark as read
    await Message.updateMany({ receiverId: me, read: false }, { read: true, readAt: new Date() });
    res.json({ success: true, messages });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const attachment = req.file ? `/uploads/${req.file.filename}` : '';
    
    if (!content && !attachment) {
      return res.status(400).json({ success: false, message: 'Message content or attachment is required' });
    }

    const msg = await Message.create({ senderId: req.user._id, receiverId, content: content || '', attachment });
    const populated = await msg.populate('senderId', 'name photo role');
    res.status(201).json({ success: true, message: populated });
  } catch (err) {
    console.error('Error in sendMessage:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({ receiverId: req.user._id, read: false });
    res.json({ success: true, count });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getConversations = async (req, res) => {
  try {
    const me = req.user._id;
    const msgs = await Message.find({ $or: [{ senderId: me }, { receiverId: me }] })
      .populate('senderId', 'name photo role').populate('receiverId', 'name photo role').sort({ createdAt: -1 });
    // Group by conversation partner
    const convMap = {};
    msgs.forEach(m => {
      const partner = m.senderId._id.toString() === me.toString() ? m.receiverId : m.senderId;
      const key = partner._id.toString();
      if (!convMap[key]) convMap[key] = { partner, lastMessage: m, unread: 0 };
      if (!m.read && m.receiverId._id.toString() === me.toString()) convMap[key].unread++;
    });
    res.json({ success: true, conversations: Object.values(convMap) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getMessages, sendMessage, getUnreadCount, getConversations };
