const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  referralPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReferralPartner', required: true, index: true },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true, unique: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true, lowercase: true },
  applicationFee: { type: Number, required: true },
  commissionPercent: { type: Number, required: true },
  commissionAmount: { type: Number, required: true },
  razorpayPaymentId: { type: String, default: '' },
  status: {
    type: String,
    enum: ['confirmed', 'included_in_payout', 'paid'],
    default: 'confirmed'
  },
  weekStart: { type: Date },
  weekEnd: { type: Date },
  payoutId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payout' },
  confirmedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Commission', commissionSchema);
