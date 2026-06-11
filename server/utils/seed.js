require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Application = require('../models/Application');
const Announcement = require('../models/Announcement');
const Attendance = require('../models/Attendance');
const Task = require('../models/Task');
const Evaluation = require('../models/Evaluation');
const Onboarding = require('../models/Onboarding');

const seed = async (shouldExit = false) => {
  if (mongoose.connection.readyState === 0) {
    await connectDB();
  }
  console.log('[INFO] Seeding database...');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}), Application.deleteMany({}),
    Announcement.deleteMany({}), Attendance.deleteMany({}),
    Task.deleteMany({}), Evaluation.deleteMany({}),
    Onboarding.deleteMany({})
  ]);

  // Create admin user
  const admin = await User.create({ 
    name: 'MAYURESH P', 
    email: 'mayure12sh12@gmail.com', 
    password: 'mAyUrEsH2911', 
    role: 'admin', 
    department: 'Management', 
    phone: '' 
  });

  console.log('[OK] Admin user created');
  console.log('\n[OK] Database seeded successfully with Admin account!');
  console.log('\n--- Admin Login Credentials ---');
  console.log(`Email    : mayure12sh12@gmail.com`);
  console.log(`Password : mAyUrEsH2911`);
  console.log('-------------------------------');

  if (shouldExit) {
    process.exit(0);
  }
};

if (require.main === module) {
  seed(true).catch(err => { console.error('[ERROR] Seed error:', err.message); process.exit(1); });
} else {
  module.exports = seed;
}
