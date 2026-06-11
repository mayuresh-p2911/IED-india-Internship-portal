const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  scheduledDate: { type: Date, required: true },
  time:          { type: String, required: true },
  mode:          { type: String, enum: ['zoom', 'google_meet', 'offline', 'phone'], default: 'zoom' },
  meetLink:      { type: String, default: '' },
  interviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
    default: 'scheduled'
  },
  feedback:      { type: String, default: '' },
  score:         { type: Number, min: 0, max: 10 },
  result:        { type: String, enum: ['pending', 'pass', 'fail'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
