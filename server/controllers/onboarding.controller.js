const Onboarding = require('../models/Onboarding');
const User = require('../models/User');
const Application = require('../models/Application');

const getOnboarding = async (req, res) => {
  try {
    const query = req.user.role === 'intern' ? { internId: req.user._id } : {};
    const records = await Onboarding.find(query)
      .populate('internId', 'name email department phone college photo internshipId')
      .populate('applicationId');
    res.json({ success: true, records, onboarding: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOnboardingById = async (req, res) => {
  try {
    const record = await Onboarding.findById(req.params.id)
      .populate('internId', 'name email department phone college photo internshipId')
      .populate('applicationId');
    if (!record) return res.status(404).json({ success: false, message: 'Onboarding record not found' });
    res.json({ success: true, record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyOnboarding = async (req, res) => {
  try {
    let record = await Onboarding.findOne({ internId: req.user._id })
      .populate('internId', 'name email department phone college photo internshipId')
      .populate('applicationId');

    // If no onboarding record exists yet for this intern, automatically create one
    if (!record) {
      const app = await Application.findOne({
        $or: [{ internId: req.user._id }, { email: req.user.email }]
      });

      const newRecord = await Onboarding.create({
        internId: req.user._id,
        applicationId: app ? app._id : undefined,
        documents: {
          resume: { uploaded: !!(app && app.resume), path: (app && app.resume) || '' },
          aadhaar: { uploaded: false, path: '' },
          collegeId: { uploaded: false, path: '' },
          photo: { uploaded: !!(app && app.photo) || !!(req.user && req.user.photo), path: (app && app.photo) || (req.user && req.user.photo) || '' }
        },
        status: 'pending'
      });

      record = await Onboarding.findById(newRecord._id)
        .populate('internId', 'name email department phone college photo internshipId')
        .populate('applicationId');
    }

    res.json({ success: true, record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { type, internId: targetInternId } = req.body;
    if (!type) {
      return res.status(400).json({ success: false, message: 'Document type is required' });
    }

    const validTypes = ['resume', 'aadhaar', 'collegeId', 'photo', 'agreement'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: `Invalid document type: ${type}` });
    }

    // Determine target intern
    let internId = req.user._id;
    if (['admin', 'hr', 'superadmin'].includes(req.user.role) && targetInternId) {
      internId = targetInternId;
    }

    let record = await Onboarding.findOne({ internId });
    if (!record) {
      const app = await Application.findOne({
        $or: [{ internId }, { email: req.user.email }]
      });
      record = new Onboarding({
        internId,
        applicationId: app ? app._id : undefined,
        documents: {
          resume: { uploaded: false, path: '' },
          aadhaar: { uploaded: false, path: '' },
          collegeId: { uploaded: false, path: '' },
          photo: { uploaded: false, path: '' }
        }
      });
    }

    const filePath = req.file.path || `/uploads/${req.file.filename}`;

    if (type === 'agreement') {
      record.agreementUploaded = true;
      record.agreementFile = filePath;
    } else {
      if (!record.documents) record.documents = {};
      record.documents[type] = {
        uploaded: true,
        path: filePath
      };
    }

    if (record.status === 'pending') {
      record.status = 'in_progress';
    }

    await record.save();

    if (type === 'photo') {
      await User.findByIdAndUpdate(internId, { photo: filePath });
    }

    const populated = await Onboarding.findById(record._id)
      .populate('internId', 'name email department phone college photo internshipId')
      .populate('applicationId');

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      record: populated,
      filePath
    });
  } catch (err) {
    console.error('[ERROR] uploadDocument:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateOnboarding = async (req, res) => {
  try {
    const record = await Onboarding.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    const data = { ...req.body };

    // Handle file uploads if multipart form was sent
    if (req.files) {
      if (req.files.agreement) {
        record.agreementFile = req.files.agreement[0].path;
        record.agreementUploaded = true;
      }
      if (req.files['documents.resume']) {
        record.documents.resume = { path: req.files['documents.resume'][0].path, uploaded: true };
      }
      if (req.files['documents.aadhaar']) {
        record.documents.aadhaar = { path: req.files['documents.aadhaar'][0].path, uploaded: true };
      }
      if (req.files['documents.collegeId']) {
        record.documents.collegeId = { path: req.files['documents.collegeId'][0].path, uploaded: true };
      }
      if (req.files['documents.photo']) {
        record.documents.photo = { path: req.files['documents.photo'][0].path, uploaded: true };
      }
    }

    // Update basic checklist items
    if (data.offerLetterSent !== undefined) record.offerLetterSent = Boolean(data.offerLetterSent);
    if (data.agreementUploaded !== undefined) record.agreementUploaded = Boolean(data.agreementUploaded);
    if (data.internIdGenerated !== undefined) record.internIdGenerated = Boolean(data.internIdGenerated);
    if (data.orientationDone !== undefined) record.orientationDone = Boolean(data.orientationDone);
    if (data.welcomeEmailSent !== undefined) record.welcomeEmailSent = Boolean(data.welcomeEmailSent);
    if (data.orientationDate) record.orientationDate = data.orientationDate;
    if (data.notes !== undefined) record.notes = data.notes;
    if (data.internshipId !== undefined) record.internshipId = data.internshipId;
    if (data.status) record.status = data.status;

    // Merge documents status without erasing existing paths
    if (data.documents && typeof data.documents === 'object') {
      if (!record.documents) record.documents = {};
      for (const key of ['resume', 'aadhaar', 'collegeId', 'photo']) {
        if (data.documents[key] !== undefined) {
          const docVal = data.documents[key];
          const cur = record.documents[key] || { uploaded: false, path: '' };
          if (typeof docVal === 'object') {
            record.documents[key] = {
              uploaded: docVal.uploaded !== undefined ? Boolean(docVal.uploaded) : cur.uploaded,
              path: docVal.path || cur.path || ''
            };
          } else if (typeof docVal === 'boolean') {
            record.documents[key] = {
              uploaded: docVal,
              path: cur.path || ''
            };
          } else if (docVal === 'uploaded') {
            record.documents[key] = {
              uploaded: true,
              path: cur.path || ''
            };
          }
        }
      }
    }

    await record.save();

    const updated = await Onboarding.findById(record._id)
      .populate('internId', 'name email department phone college photo internshipId')
      .populate('applicationId');

    res.json({ success: true, record: updated });
  } catch (err) {
    console.error('[ERROR] updateOnboarding:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getOnboarding, getOnboardingById, getMyOnboarding, uploadDocument, updateOnboarding };
