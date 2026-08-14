const Attendance = require('../models/Attendance');
const User = require('../models/User');

// Helper to get local date string YYYY-MM-DD from server Date using client timezone offset (in minutes)
function getLocalDateStr(dateObj = new Date(), offsetMinutes = null) {
  if (offsetMinutes !== null && offsetMinutes !== undefined && !isNaN(offsetMinutes)) {
    const localMs = dateObj.getTime() - (Number(offsetMinutes) * 60 * 1000);
    return new Date(localMs).toISOString().split('T')[0];
  }
  return dateObj.toISOString().split('T')[0];
}

// Helper to get local time string HH:mm from server Date using client timezone offset (in minutes)
function getLocalTimeStr(dateObj = new Date(), offsetMinutes = null) {
  if (offsetMinutes !== null && offsetMinutes !== undefined && !isNaN(offsetMinutes)) {
    const localMs = dateObj.getTime() - (Number(offsetMinutes) * 60 * 1000);
    return new Date(localMs).toISOString().slice(11, 16);
  }
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

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
    const { type, location, clientTime, clientDate, timezoneOffset } = req.body;
    const now = new Date();
    
    // Determine user's local date (e.g., 2026-08-14)
    const today = clientDate || getLocalDateStr(now, timezoneOffset);
    
    // Determine user's local check time (e.g., 22:42)
    const currentTime = clientTime || getLocalTimeStr(now, timezoneOffset);

    const internId = req.user._id;
    const existing = await Attendance.findOne({ internId, date: today });
    
    if (existing) {
      // Check-out
      existing.checkOut = currentTime;
      await existing.save();
      return res.json({ success: true, message: 'Check-out recorded', record: existing });
    }
    
    const record = await Attendance.create({
      internId,
      date: today,
      type: type || 'office',
      checkIn: currentTime,
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
    const { date: clientDate, tz: timezoneOffset } = req.query;
    const today = clientDate || getLocalDateStr(new Date(), timezoneOffset);
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
