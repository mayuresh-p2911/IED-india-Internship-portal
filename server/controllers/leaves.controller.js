const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');

const getLeaves = async (req, res) => {
  try {
    const { status } = req.query;
    const query = req.user.role === 'intern' ? { internId: req.user._id } : {};
    if (status) query.status = status;
    const leaves = await Leave.find(query).populate('internId', 'name email department').populate('approvedBy', 'name').sort({ createdAt: -1 });
    res.json({ success: true, leaves });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const applyLeave = async (req, res) => {
  try {
    const { fromDate, toDate, reason, type } = req.body;
    const from = new Date(fromDate), to = new Date(toDate);
    const days = Math.ceil((to - from) / (1000 * 3600 * 24)) + 1;
    const leave = await Leave.create({ internId: req.user._id, fromDate: from, toDate: to, days, reason, type });
    res.status(201).json({ success: true, leave });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const updateLeaveStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const leave = await Leave.findByIdAndUpdate(req.params.id,
      { status, remarks, approvedBy: req.user._id, approvedAt: new Date() }, { new: true });
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });

    // If approved, mark attendance for those dates as on_leave
    if (status === 'approved') {
      const from = new Date(leave.fromDate), to = new Date(leave.toDate);
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        await Attendance.findOneAndUpdate(
          { internId: leave.internId, date: dateStr },
          { internId: leave.internId, date: dateStr, status: 'on_leave', type: 'leave' },
          { upsert: true }
        );
      }
    }
    res.json({ success: true, leave });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getLeaves, applyLeave, updateLeaveStatus };
