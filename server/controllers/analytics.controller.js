const User = require('../models/User');
const Application = require('../models/Application');
const Attendance = require('../models/Attendance');
const Task = require('../models/Task');
const Certificate = require('../models/Certificate');
const Evaluation = require('../models/Evaluation');
const Leave = require('../models/Leave');

const getSummary = async (req, res) => {
  try {
    const [
      totalInterns, activeInterns, totalApplications, pendingApplications,
      totalTasks, pendingTasks, completedTasks,
      totalCertificates, pendingLeaves,
      deptStats, appStats, taskStats
    ] = await Promise.all([
      User.countDocuments({ role: 'intern' }),
      User.countDocuments({ role: 'intern', isActive: true }),
      Application.countDocuments(),
      Application.countDocuments({ status: { $in: ['applied', 'shortlisted'] } }),
      Task.countDocuments(),
      Task.countDocuments({ status: { $in: ['todo', 'in_progress'] } }),
      Task.countDocuments({ status: 'approved' }),
      Certificate.countDocuments(),
      Leave.countDocuments({ status: 'pending' }),
      User.aggregate([{ $match: { role: 'intern' } }, { $group: { _id: '$department', count: { $sum: 1 } } }]),
      Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    // Today's attendance
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = await Attendance.countDocuments({ date: today, status: { $in: ['present', 'wfh'] } });

    // Monthly applications (last 6 months)
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyApps = await Application.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Average evaluation score
    const evalAvg = await Evaluation.aggregate([{ $group: { _id: null, avg: { $avg: '$overallScore' } } }]);

    res.json({
      success: true,
      stats: {
        totalInterns, activeInterns, totalApplications, pendingApplications,
        totalTasks, pendingTasks, completedTasks, totalCertificates,
        pendingLeaves, todayAttendance,
        avgEvaluationScore: evalAvg[0]?.avg?.toFixed(1) || 0,
      },
      charts: { deptStats, appStats, taskStats, monthlyApps }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getMentorStats = async (req, res) => {
  try {
    const mentorId = req.user._id;
    const assignedInterns = await User.countDocuments({ assignedMentor: mentorId });
    const tasks = await Task.countDocuments({ assignedBy: mentorId });
    const pendingReviews = await Task.countDocuments({ assignedBy: mentorId, status: 'submitted' });
    const evaluations = await Evaluation.countDocuments({ mentorId });
    res.json({ success: true, stats: { assignedInterns, tasks, pendingReviews, evaluations } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getInternStats = async (req, res) => {
  try {
    const internId = req.user._id;
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.slice(0, 7);
    const [tasks, attendance, certs, evaluations, todayRecord] = await Promise.all([
      Task.find({ assignedTo: internId }),
      Attendance.find({ internId, date: { $regex: `^${currentMonth}` } }),
      Certificate.countDocuments({ internId }),
      Evaluation.find({ internId }).sort({ week: -1 }).limit(5),
      Attendance.findOne({ internId, date: today })
    ]);
    res.json({
      success: true,
      stats: {
        totalTasks: tasks.length,
        pendingTasks: tasks.filter(t => ['todo','in_progress'].includes(t.status)).length,
        submittedTasks: tasks.filter(t => t.status === 'submitted').length,
        approvedTasks: tasks.filter(t => t.status === 'approved').length,
        presentDays: attendance.filter(a => ['present','wfh'].includes(a.status)).length,
        totalWorkingDays: attendance.length,
        certificates: certs,
        latestEvaluation: evaluations[0] || null,
        todayAttendance: todayRecord
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getSummary, getMentorStats, getInternStats };
