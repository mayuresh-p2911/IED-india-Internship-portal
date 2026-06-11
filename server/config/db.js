const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('[INFO] Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[OK] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[WARN] Primary MongoDB connection failed: ${error.message}`);
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
    } catch (fallbackError) {
      console.error(`[ERROR] In-Memory MongoDB Connection Error: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
