const mongoose = require('mongoose');

const INTERNSHIP_POSITIONS = [
  'Digital Marketing Intern',
  'HR & Recruitment Intern',
  'Business Development Intern',
  'Social Media Intern',
  'Entrepreneurship Training Intern',
  'IT Support Intern',
  'Management Intern'
];

const DEPARTMENTS = [
  'Digital Marketing',
  'HR & Recruitment',
  'Business Development',
  'Social Media',
  'Entrepreneurship Training',
  'IT Support',
  'Management'
];

const STUDY_YEARS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  'Final Year',
  'Postgraduate',
  'Recent Graduate'
];

const REFERRAL_STATUSES = [
  'Pending Review',
  'Under Review',
  'Shortlisted',
  'Interview Scheduled',
  'Selected',
  'Rejected'
];

const statusHistorySchema = new mongoose.Schema({
  previousStatus: { type: String, default: null },
  newStatus:      { type: String, enum: REFERRAL_STATUSES, required: true },
  updatedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedAt:      { type: Date, default: Date.now },
  remarks:        { type: String, default: '', trim: true }
}, { _id: false });

const referralSchema = new mongoose.Schema({
  referralId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  referredUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  college: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  currentYear: {
    type: String,
    required: true,
    trim: true
  },
  technicalSkills: {
    type: [String],
    required: true,
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.length > 0,
      message: 'At least one technical skill is required'
    }
  },
  internshipPosition: {
    type: String,
    required: true,
    enum: INTERNSHIP_POSITIONS
  },
  message: {
    type: String,
    default: '',
    trim: true,
    maxlength: 1000
  },
  resume: {
    filename:     { type: String, required: true },
    originalName: { type: String, required: true },
    contentType:  { type: String, required: true },
    size:         { type: Number, required: true },
    data:         { type: Buffer, required: true, select: false }
  },
  status: {
    type: String,
    enum: REFERRAL_STATUSES,
    default: 'Pending Review',
    index: true
  },
  adminRemarks: {
    type: String,
    default: '',
    trim: true
  },
  statusHistory: {
    type: [statusHistorySchema],
    default: []
  }
}, { timestamps: true });

referralSchema.index({ email: 1, internshipPosition: 1 }, { unique: true });

const Referral = mongoose.model('Referral', referralSchema);

module.exports = {
  Referral,
  INTERNSHIP_POSITIONS,
  DEPARTMENTS,
  STUDY_YEARS,
  REFERRAL_STATUSES
};

