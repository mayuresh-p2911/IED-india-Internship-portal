const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
  internId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentorId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  week:      { type: Number, required: true },
  period:    { type: String, default: '' }, // e.g., "Week 1: Jun 1 - Jun 7"
  ratings: {
    communication:  { type: Number, min: 1, max: 10, default: 5 },
    teamwork:       { type: Number, min: 1, max: 10, default: 5 },
    leadership:     { type: Number, min: 1, max: 10, default: 5 },
    discipline:     { type: Number, min: 1, max: 10, default: 5 },
    technical:      { type: Number, min: 1, max: 10, default: 5 },
    taskCompletion: { type: Number, min: 1, max: 10, default: 5 },
  },
  overallScore: { type: Number, min: 1, max: 10 },
  comments:     { type: String, default: '' },
  strengths:    { type: String, default: '' },
  improvements: { type: String, default: '' },
  recommendation: { type: String, enum: ['excellent', 'good', 'average', 'needs_improvement'], default: 'good' },
}, { timestamps: true });

module.exports = mongoose.model('Evaluation', evaluationSchema);
