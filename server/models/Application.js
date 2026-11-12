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
  payment: {
    orderId:   { type: String, default: '', trim: true },
    paymentId: { type: String, default: '', trim: true },
    signature: { type: String, default: '', trim: true },
    amount:    { type: Number, default: 0 }, // in INR
    currency:  { type: String, default: 'INR' },
    status:    { type: String, enum: ['pending', 'paid', 'failed'], default: 'paid' },
    paidAt:    { type: Date }
  },
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
