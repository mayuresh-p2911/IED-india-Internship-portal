const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title:      { type: String, required: true, trim: true },
  content:    { type: String, required: true },
  postedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetRole: { type: String, enum: ['all', 'intern', 'mentor', 'hr', 'admin'], default: 'all' },
  department: { type: String, default: 'all' },
  isPinned:   { type: Boolean, default: false },
  expiresAt:  { type: Date },
  attachment: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
