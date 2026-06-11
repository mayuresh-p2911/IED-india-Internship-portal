const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  internId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromDate:   { type: Date, required: true },
  toDate:     { type: Date, required: true },
  days:       { type: Number, default: 1 },
  reason:     { type: String, required: true },
  type:       { type: String, enum: ['sick', 'casual', 'personal', 'emergency'], default: 'casual' },
  status:     { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  remarks:    { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Leave', leaveSchema);
