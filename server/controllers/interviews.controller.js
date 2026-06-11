const Interview = require('../models/Interview');
const Application = require('../models/Application');
const emailService = require('../services/email.service');

const getInterviews = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const interviews = await Interview.find(query).populate('applicationId').populate('interviewedBy', 'name email').limit(+limit).skip((+page - 1) * +limit).sort({ scheduledDate: 1 });
    const total = await Interview.countDocuments(query);
    res.json({ success: true, interviews, total });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id).populate('applicationId').populate('interviewedBy', 'name');
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
    res.json({ success: true, interview });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const scheduleInterview = async (req, res) => {
  try {
    const interview = await Interview.create({ ...req.body, interviewedBy: req.user._id });
    // Update application status
    await Application.findByIdAndUpdate(req.body.applicationId, { status: 'interview_scheduled' });
    const app = await Application.findById(req.body.applicationId);
    if (app) await emailService.sendInterviewScheduled(app.email, app.name, interview);
    res.status(201).json({ success: true, interview });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const updateInterview = async (req, res) => {
  try {
    const interview = await Interview.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
    res.json({ success: true, interview });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const deleteInterview = async (req, res) => {
  try {
    await Interview.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Interview deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getInterviews, getInterview, scheduleInterview, updateInterview, deleteInterview };
