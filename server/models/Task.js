const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  department:  { type: String, default: '' },
  deadline:    { type: Date, required: true },
  priority:    { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'submitted', 'approved', 'rejected', 'revision'],
    default: 'todo'
  },
  attachments:     [String],
  submissionNote:  { type: String, default: '' },
  submissionFile:  { type: String, default: '' },
  submittedAt:     { type: Date },
  feedback:        { type: String, default: '' },
  completionScore: { type: Number, min: 0, max: 10 },
  tags:            [String],
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
