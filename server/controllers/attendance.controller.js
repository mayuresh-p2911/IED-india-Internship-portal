const Attendance = require('../models/Attendance');
const User = require('../models/User');

// @desc  Get attendance records
// @route GET /api/attendance
const getAttendance = async (req, res) => {
  try {
    const { internId, month, year, date } = req.query;
    const query = {};
    if (req.user.role === 'intern') query.internId = req.user._id;
    else if (internId) query.internId = internId;
    if (date) { query.date = date; }
    else if (month && year) {
      const pad = String(month).padStart(2, '0');
      query.date = { $regex: `^${year}-${pad}` };
    }
    const records = await Attendance.find(query).populate('internId', 'name email department').sort({ date: -1 });
    res.json({ success: true, records });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// @desc  Mark attendance (intern)
// @route POST /api/attendance/mark
const markAttendance = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const internId = req.user._id;
    const existing = await Attendance.findOne({ internId, date: today });
    if (existing) {
      // Check-out
      existing.checkOut = new Date().toTimeString().slice(0, 5);
      await existing.save();
      return res.json({ success: true, message: 'Check-out recorded', record: existing });
    }
    const { type, location } = req.body;
    const record = await Attendance.create({
      internId, date: today, type: type || 'office',
      checkIn: new Date().toTimeString().slice(0, 5),
      status: type === 'wfh' ? 'wfh' : 'present',
      location: location || {}
    });
    res.status(201).json({ success: true, message: 'Check-in recorded', record });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// @desc  Get today's attendance status for current intern
// @route GET /api/attendance/today
const getTodayStatus = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const internId = req.user.role === 'intern' ? req.user._id : req.query.internId;
    const record = await Attendance.findOne({ internId, date: today });
    res.json({ success: true, record, today });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// @desc  Get attendance summary/report
// @route GET /api/attendance/report
const getReport = async (req, res) => {
  try {
    const { internId, month, year } = req.query;
    const query = { internId: internId || req.user._id };
    if (month && year) {
      const pad = String(month).padStart(2, '0');
      query.date = { $regex: `^${year}-${pad}` };
    }
    const records = await Attendance.find(query);
    const summary = {
      present: records.filter(r => r.status === 'present').length,
      absent:  records.filter(r => r.status === 'absent').length,
      wfh:     records.filter(r => r.status === 'wfh').length,
      late:    records.filter(r => r.status === 'late').length,
      on_leave:records.filter(r => r.status === 'on_leave').length,
      total:   records.length
    };
    res.json({ success: true, records, summary });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// @desc Admin manually update attendance
// @route PUT /api/attendance/:id
const updateAttendance = async (req, res) => {
  try {
    const record = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, record });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getAttendance, markAttendance, getTodayStatus, getReport, updateAttendance };
