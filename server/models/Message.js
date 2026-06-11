const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:    { type: String, default: '' },
  read:       { type: Boolean, default: false },
  readAt:     { type: Date },
  attachment: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
