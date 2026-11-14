const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  referralPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReferralPartner', required: true, index: true },
  amount: { type: Number, required: true, min: 1 },
  commissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Commission' }],
  status: {
    type: String,
    enum: ['requested', 'approved', 'processing', 'paid', 'rejected'],
    default: 'requested'
  },
  requestedAt: { type: Date, default: Date.now },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date },
  utrNumber: { type: String, default: '' },
  transactionRef: { type: String, default: '' },
  remarks: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Payout', payoutSchema);
