const Onboarding = require('../models/Onboarding');

const getOnboarding = async (req, res) => {
  try {
    const query = req.user.role === 'intern' ? { internId: req.user._id } : {};
    const records = await Onboarding.find(query).populate('internId', 'name email department phone').populate('applicationId');
    res.json({ success: true, records });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getOnboardingById = async (req, res) => {
  try {
    const record = await Onboarding.findById(req.params.id).populate('internId', 'name email department').populate('applicationId');
    if (!record) return res.status(404).json({ success: false, message: 'Onboarding record not found' });
    res.json({ success: true, record });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getMyOnboarding = async (req, res) => {
  try {
    const record = await Onboarding.findOne({ internId: req.user._id }).populate('internId', 'name email');
    res.json({ success: true, record });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const updateOnboarding = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.files) {
      if (req.files.agreement) data.agreementFile = req.files.agreement[0].path;
      if (req.files['documents.resume'])    data['documents.resume.path']    = req.files['documents.resume'][0].path,    data['documents.resume.uploaded']    = true;
      if (req.files['documents.aadhaar'])   data['documents.aadhaar.path']   = req.files['documents.aadhaar'][0].path,   data['documents.aadhaar.uploaded']   = true;
      if (req.files['documents.collegeId']) data['documents.collegeId.path'] = req.files['documents.collegeId'][0].path, data['documents.collegeId.uploaded'] = true;
      if (req.files['documents.photo'])     data['documents.photo.path']     = req.files['documents.photo'][0].path,     data['documents.photo.uploaded']     = true;
    }
    const record = await Onboarding.findByIdAndUpdate(req.params.id, { $set: data }, { new: true });
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, record });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getOnboarding, getOnboardingById, getMyOnboarding, updateOnboarding };
