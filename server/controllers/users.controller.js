const User = require('../models/User');

// @desc  Get all users
// @route GET /api/users
const getUsers = async (req, res) => {
  try {
    const { role, department, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (department) query.department = department;
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const users = await User.find(query).populate('assignedMentor', 'name email').limit(+limit).skip((+page - 1) * +limit).sort({ createdAt: -1 });
    const total = await User.countDocuments(query);
    res.json({ success: true, users, total, pages: Math.ceil(total / +limit) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// @desc  Get single user
// @route GET /api/users/:id
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('assignedMentor', 'name email');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// @desc  Create user (admin)
// @route POST /api/users
const createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ success: true, user });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Email already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update user
// @route PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, rest, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (password) { user.password = password; await user.save(); }
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// @desc  Delete (deactivate) user
// @route DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'User deactivated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// @desc  Get mentors (for dropdown)
// @route GET /api/users/mentors
const getMentors = async (req, res) => {
  try {
    const mentors = await User.find({ role: 'mentor', isActive: true }).select('name email department');
    res.json({ success: true, mentors });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser, getMentors };
