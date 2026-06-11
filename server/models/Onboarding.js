const mongoose = require('mongoose');

const onboardingSchema = new mongoose.Schema({
  internId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
  offerLetterSent:    { type: Boolean, default: false },
  offerLetterDate:    { type: Date },
  agreementUploaded:  { type: Boolean, default: false },
  agreementFile:      { type: String, default: '' },
  internId_generated: { type: String, default: '' },
  orientationDate:    { type: Date },
  orientationDone:    { type: Boolean, default: false },
  welcomeEmailSent:   { type: Boolean, default: false },
  documents: {
    resume:    { uploaded: { type: Boolean, default: false }, path: { type: String, default: '' } },
    aadhaar:   { uploaded: { type: Boolean, default: false }, path: { type: String, default: '' } },
    collegeId: { uploaded: { type: Boolean, default: false }, path: { type: String, default: '' } },
    photo:     { uploaded: { type: Boolean, default: false }, path: { type: String, default: '' } },
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'complete'],
    default: 'pending'
  },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Onboarding', onboardingSchema);
