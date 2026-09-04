const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  internId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:          { type: String, enum: ['completion', 'recommendation', 'appreciation'], default: 'completion' },
  certificateNo: { type: String },
  certNo:        { type: String },
  issuedDate:    { type: Date, default: Date.now },
  validFrom:     { type: Date },
  validTo:       { type: Date },
  department:    { type: String, default: '' },
  duration:      { type: String, default: '' },
  performance:   { type: String, enum: ['excellent', 'good', 'average'], default: 'good' },
  qrCode:        { type: String, default: '' },
  pdfPath:       { type: String, default: '' },
  issuedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive:      { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Certificate', certificateSchema);
