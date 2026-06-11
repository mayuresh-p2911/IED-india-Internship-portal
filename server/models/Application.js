const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, lowercase: true },
  phone:      { type: String, required: true },
  college:    { type: String, required: true },
  course:     { type: String, default: '' },
  department: { type: String, required: true },
  duration:   { type: Number, required: true }, // weeks
  startDate:  { type: Date },
  resume:     { type: String, default: '' }, // file path
  photo:      { type: String, default: '' }, // file path
  coverLetter:{ type: String, default: '' },
  skills:     [String],
  status: {
    type: String,
    enum: ['applied', 'shortlisted', 'interview_scheduled', 'selected', 'rejected', 'on_hold'],
    default: 'applied'
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes:      { type: String, default: '' },
  internId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // once selected & account created
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
