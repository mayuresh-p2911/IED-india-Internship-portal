require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB().catch(err => {
  console.error('[FATAL] Database connection failed at startup:', err.message);
});

const app = express();

// Security & logging middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving (uploads & client)
app.get('/uploads/*', (req, res) => {
  const relativePath = req.params[0];
  const filename = path.basename(relativePath);
  const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';
  
  if (isVercel) {
    let filePath = path.join(require('os').tmpdir(), relativePath);
    if (require('fs').existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    const tmpDirs = ['profile', 'messages', 'applications', 'onboarding', 'tasks'];
    for (const dir of tmpDirs) {
      filePath = path.join(require('os').tmpdir(), dir, filename);
      if (require('fs').existsSync(filePath)) {
        return res.sendFile(filePath);
      }
    }
  }
  
  let localPath = path.join(__dirname, 'uploads', relativePath);
  if (require('fs').existsSync(localPath)) {
    return res.sendFile(localPath);
  }
  
  const localDirs = ['', 'applications', 'onboarding', 'tasks'];
  for (const dir of localDirs) {
    localPath = path.join(__dirname, 'uploads', dir, filename);
    if (require('fs').existsSync(localPath)) {
      return res.sendFile(localPath);
    }
  }
  
  res.status(404).send('File not found');
});

app.use(express.static(path.join(__dirname, '../client')));

// API Routes
app.use('/api/auth',          require('./routes/auth.routes'));
app.use('/api/users',         require('./routes/users.routes'));
app.use('/api/applications',  require('./routes/applications.routes'));
app.use('/api/interviews',    require('./routes/interviews.routes'));
app.use('/api/onboarding',    require('./routes/onboarding.routes'));
app.use('/api/attendance',    require('./routes/attendance.routes'));
app.use('/api/tasks',         require('./routes/tasks.routes'));
app.use('/api/messages',      require('./routes/messages.routes'));
app.use('/api/announcements', require('./routes/announcements.routes'));
app.use('/api/evaluations',   require('./routes/evaluations.routes'));
app.use('/api/certificates',  require('./routes/certificates.routes'));
app.use('/api/leaves',        require('./routes/leaves.routes'));
app.use('/api/analytics',     require('./routes/analytics.routes'));

// Serve client SPA for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[OK] IED IMS Server running on http://localhost:${PORT}`);
    console.log(`[INFO] Environment: ${process.env.NODE_ENV}`);
  });
}

module.exports = app;
