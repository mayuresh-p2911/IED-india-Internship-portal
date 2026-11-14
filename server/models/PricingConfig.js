const mongoose = require('mongoose');

const pricingConfigSchema = new mongoose.Schema({
  department: { type: String, default: null, trim: true },
  applicationFee: { type: Number, required: true, min: 1 },
  commissionPercent: { type: Number, default: 10, min: 0, max: 100 },
  isActive: { type: Boolean, default: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changeHistory: [{
    previousFee: Number,
    previousCommission: Number,
    newFee: Number,
    newCommission: Number,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    reason: { type: String, default: '' }
  }]
}, { timestamps: true });

pricingConfigSchema.index({ department: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('PricingConfig', pricingConfigSchema);
