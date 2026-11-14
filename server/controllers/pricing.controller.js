const PricingConfig = require('../models/PricingConfig');

const getPublicPricingConfig = async (req, res) => {
  try {
    const { department } = req.query;
    let config = null;
    if (department) {
      config = await PricingConfig.findOne({ department, isActive: true });
    }
    if (!config) {
      config = await PricingConfig.findOne({ department: null, isActive: true });
    }

    const parsedFee = Number(process.env.APPLICATION_FEE_INR);
    const envFee = Number.isFinite(parsedFee) && parsedFee > 0 ? parsedFee : 99;

    res.json({
      success: true,
      applicationFee: config ? config.applicationFee : envFee,
      commissionPercent: config ? config.commissionPercent : 10,
      currency: 'INR',
      department: department || 'default'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAdminPricingConfigs = async (req, res) => {
  try {
    const configs = await PricingConfig.find()
      .populate('updatedBy', 'name email')
      .populate('changeHistory.changedBy', 'name email')
      .sort({ department: 1 });
    res.json({ success: true, configs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updatePricingConfig = async (req, res) => {
  try {
    const { department, applicationFee, commissionPercent, reason } = req.body;

    if (!applicationFee || applicationFee <= 0) {
      return res.status(400).json({ success: false, message: 'Application fee must be greater than 0' });
    }
    if (commissionPercent < 0 || commissionPercent > 100) {
      return res.status(400).json({ success: false, message: 'Commission percent must be between 0 and 100' });
    }

    const dept = department && department.trim() !== '' ? department.trim() : null;
    let config = await PricingConfig.findOne({ department: dept });

    if (config) {
      config.changeHistory.push({
        previousFee: config.applicationFee,
        previousCommission: config.commissionPercent,
        newFee: applicationFee,
        newCommission: commissionPercent,
        changedBy: req.user._id,
        changedAt: new Date(),
        reason: reason || ''
      });
      config.applicationFee = applicationFee;
      config.commissionPercent = commissionPercent;
      config.updatedBy = req.user._id;
      config.isActive = true;
      await config.save();
    } else {
      config = await PricingConfig.create({
        department: dept,
        applicationFee,
        commissionPercent,
        isActive: true,
        updatedBy: req.user._id,
        changeHistory: [{
          previousFee: 0,
          previousCommission: 0,
          newFee: applicationFee,
          newCommission: commissionPercent,
          changedBy: req.user._id,
          changedAt: new Date(),
          reason: reason || 'Initial configuration'
        }]
      });
    }

    res.json({ success: true, config, message: 'Pricing configuration updated successfully' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Configuration for this department already exists' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getPublicPricingConfig, getAdminPricingConfigs, updatePricingConfig };
