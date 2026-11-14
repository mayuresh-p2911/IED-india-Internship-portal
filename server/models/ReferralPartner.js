const mongoose = require('mongoose');

const referralPartnerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  referralId: { type: String, required: true, unique: true, uppercase: true },
  referralCode: { type: String, required: true, unique: true, uppercase: true },
  phone: { type: String, default: '', trim: true },
  totalReferred: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  availableBalance: { type: Number, default: 0 },
  totalPaidOut: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('ReferralPartner', referralPartnerSchema);
