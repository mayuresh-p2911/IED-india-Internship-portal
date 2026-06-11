const Evaluation = require('../models/Evaluation');
const User = require('../models/User');

const getEvaluations = async (req, res) => {
  try {
    const { internId, mentorId } = req.query;
    const query = {};
    if (req.user.role === 'intern') query.internId = req.user._id;
    else if (req.user.role === 'mentor') query.mentorId = req.user._id;
    if (internId) query.internId = internId;
    if (mentorId) query.mentorId = mentorId;
    const evaluations = await Evaluation.find(query).populate('internId', 'name email department').populate('mentorId', 'name email').sort({ week: -1 });
    res.json({ success: true, evaluations });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getEvaluation = async (req, res) => {
  try {
    const ev = await Evaluation.findById(req.params.id).populate('internId', 'name email').populate('mentorId', 'name');
    if (!ev) return res.status(404).json({ success: false, message: 'Evaluation not found' });
    res.json({ success: true, evaluation: ev });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const createEvaluation = async (req, res) => {
  try {
    const data = { ...req.body, mentorId: req.user._id };
    const r = data.ratings;
    if (r) {
      const vals = Object.values(r).map(Number).filter(Boolean);
      data.overallScore = vals.length ? +(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1) : 5;
    }
    const evaluation = await Evaluation.create(data);
    res.status(201).json({ success: true, evaluation });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const updateEvaluation = async (req, res) => {
  try {
    const r = req.body.ratings;
    if (r) {
      const vals = Object.values(r).map(Number).filter(Boolean);
      req.body.overallScore = vals.length ? +(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1) : 5;
    }
    const ev = await Evaluation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, evaluation: ev });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getInternProgress = async (req, res) => {
  try {
    const evaluations = await Evaluation.find({ internId: req.params.internId }).sort({ week: 1 });
    const avg = field => evaluations.length ? +(evaluations.reduce((s,e) => s + (e.ratings[field] || 0), 0) / evaluations.length).toFixed(1) : 0;
    const progress = {
      weeks: evaluations.map(e => ({ week: e.week, overall: e.overallScore, ratings: e.ratings })),
      averages: { communication: avg('communication'), teamwork: avg('teamwork'), leadership: avg('leadership'), discipline: avg('discipline'), technical: avg('technical'), taskCompletion: avg('taskCompletion') },
      overallAverage: evaluations.length ? +(evaluations.reduce((s,e)=>s+e.overallScore,0)/evaluations.length).toFixed(1) : 0
    };
    res.json({ success: true, progress });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getEvaluations, getEvaluation, createEvaluation, updateEvaluation, getInternProgress };
