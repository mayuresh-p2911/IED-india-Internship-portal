const Task = require('../models/Task');

const getTasks = async (req, res) => {
  try {
    const { status, priority, department } = req.query;
    const query = {};
    if (req.user.role === 'intern') query.assignedTo = req.user._id;
    else if (req.user.role === 'mentor') query.assignedBy = req.user._id;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (department) query.department = department;
    const tasks = await Task.find(query).populate('assignedTo', 'name email department').populate('assignedBy', 'name email').sort({ deadline: 1 });
    res.json({ success: true, tasks });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('assignedTo', 'name email').populate('assignedBy', 'name email');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, task });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const createTask = async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, assignedBy: req.user._id });
    res.status(201).json({ success: true, task });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, task });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const submitTask = async (req, res) => {
  try {
    const { submissionNote } = req.body;
    const data = { status: 'submitted', submissionNote, submittedAt: new Date() };
    if (req.file) data.submissionFile = req.file.path;
    const task = await Task.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, task });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const reviewTask = async (req, res) => {
  try {
    const { status, feedback, completionScore } = req.body;
    const task = await Task.findByIdAndUpdate(req.params.id, { status, feedback, completionScore }, { new: true });
    res.json({ success: true, task });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const deleteTask = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getTasks, getTask, createTask, updateTask, submitTask, reviewTask, deleteTask };
