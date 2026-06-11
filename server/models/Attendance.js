const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  internId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:      { type: String, required: true }, // YYYY-MM-DD
  checkIn:   { type: String },
  checkOut:  { type: String },
  type:      { type: String, enum: ['office', 'wfh', 'absent', 'leave'], default: 'office' },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String, default: '' }
  },
  status:    { type: String, enum: ['present', 'absent', 'late', 'wfh', 'on_leave'], default: 'present' },
  markedAt:  { type: Date, default: Date.now },
  approvedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes:     { type: String, default: '' },
}, { timestamps: true });

attendanceSchema.index({ internId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
