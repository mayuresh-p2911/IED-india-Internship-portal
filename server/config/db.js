const mongoose = require('mongoose');
const dns = require('dns');

// Ensure DNS resolution for MongoDB SRV records works reliably across all environments
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (_) {}

const WORKING_URI = 'mongodb+srv://mayure12sh12:mtg01@iedindia1.isglc46.mongodb.net/ied-ims?appName=iedindia1';

let cachedConnection = null;

const connectDB = async () => {
  // If already connected, reuse connection immediately
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If currently connecting, wait for existing promise
  if (cachedConnection && mongoose.connection.readyState === 2) {
    return cachedConnection;
  }

  const uri = process.env.MONGODB_URI || WORKING_URI;

  try {
    console.log('[INFO] Connecting to MongoDB...');
    cachedConnection = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000
    });

    const conn = await cachedConnection;
    console.log(`[OK] MongoDB Connected: ${conn.connection.host}`);

    // Auto-seed or update admin credentials
    try {
      const User = require('../models/User');
      const adminEmail = 'rate04593@gmail.com';
      const adminPass = 'IED@@291';
      let adminUser = await User.findOne({ email: adminEmail });
      if (!adminUser) {
        console.log('[INFO] Admin user not found. Auto-seeding admin user...');
        await User.create({
          name: 'Super Admin',
          email: adminEmail,
          password: adminPass,
          role: 'admin',
          department: 'Management',
          phone: ''
        });
        console.log('[OK] Admin user auto-seeded successfully!');
      } else {
        adminUser.password = adminPass;
        adminUser.role = 'admin';
        await adminUser.save();
      }
    } catch (seedErr) {
      console.warn(`[WARN] Auto-seeding/updating admin user failed: ${seedErr.message}`);
    }

    return conn;
  } catch (error) {
    cachedConnection = null;
    console.warn(`[WARN] Primary MongoDB connection failed: ${error.message}`);

    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      // In production / Vercel, if primary URI failed and was an env var, try the working fallback
      if (process.env.MONGODB_URI && uri !== WORKING_URI) {
        try {
          console.log('[INFO] Retrying with working MongoDB Atlas connection string...');
          cachedConnection = mongoose.connect(WORKING_URI, {
            serverSelectionTimeoutMS: 8000,
            connectTimeoutMS: 8000
          });
          const conn = await cachedConnection;
          console.log(`[OK] Connected to MongoDB Atlas fallback: ${conn.connection.host}`);
          return conn;
        } catch (retryErr) {
          console.error('[ERROR] Both primary and fallback MongoDB connections failed:', retryErr.message);
        }
      }
      throw new Error(`Database connection failed: ${error.message}`);
    }

    console.log('[INFO] Spinning up an in-memory MongoDB database fallback for local development...');
    try {
      const serverPkgName = 'mongodb-memory-server';
      const { MongoMemoryServer } = require(serverPkgName);
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();

      const conn = await mongoose.connect(mongoUri);
      console.log(`[OK] Connected to In-Memory MongoDB: ${conn.connection.host}`);

      console.log('[INFO] Seeding in-memory database with demo data...');
      const seed = require('../utils/seed');
      await seed(false);
      console.log('[OK] In-memory database seeded successfully!');
      return conn;
    } catch (fallbackError) {
      console.error(`[ERROR] In-Memory MongoDB Connection Error: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
