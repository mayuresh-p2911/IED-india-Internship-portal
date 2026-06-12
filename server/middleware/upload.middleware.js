const fs = require('fs');
const Upload = require('../models/Upload');

const persistUploads = async (req, res, next) => {
  try {
    const processFile = async (file) => {
      if (!file) return;

      let data;

      // Case 1: File is in memory (memoryStorage / Vercel)
      if (file.buffer) {
        data = file.buffer;
      }
      // Case 2: File is on disk (diskStorage / local)
      else if (file.path && fs.existsSync(file.path)) {
        data = fs.readFileSync(file.path);
        try { fs.unlinkSync(file.path); } catch (_) {}
      }

      if (!data) {
        console.warn(`[WARN] No file data found for ${file.filename || file.originalname}`);
        return;
      }

      await Upload.findOneAndUpdate(
        { filename: file.filename },
        { filename: file.filename, contentType: file.mimetype, data },
        { upsert: true, new: true }
      );

      console.log(`[OK] File '${file.filename}' saved to MongoDB (${data.length} bytes)`);

      // Always normalise path so controller uses the /uploads/ URL
      file.path = `/uploads/${file.filename}`;
    };

    if (req.file) {
      await processFile(req.file);
    }

    if (req.files) {
      for (const fieldName of Object.keys(req.files)) {
        for (const file of req.files[fieldName]) {
          await processFile(file);
        }
      }
    }

    next();
  } catch (error) {
    console.error(`[ERROR] persistUploads failed: ${error.message}`);
    next(error);
  }
};

module.exports = { persistUploads };
