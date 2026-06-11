const fs = require('fs');
const Upload = require('../models/Upload');

const persistUploads = async (req, res, next) => {
  try {
    const processFile = async (file) => {
      if (!file || !file.path) return;
      
      if (fs.existsSync(file.path)) {
        const data = fs.readFileSync(file.path);
        
        await Upload.findOneAndUpdate(
          { filename: file.filename },
          {
            filename: file.filename,
            contentType: file.mimetype,
            data: data
          },
          { upsert: true, new: true }
        );
        
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkErr) {
          console.warn(`[WARN] Failed to delete temporary file ${file.path}: ${unlinkErr.message}`);
        }
      }
    };

    if (req.file) {
      await processFile(req.file);
      req.file.path = `/uploads/${req.file.filename}`;
    }

    if (req.files) {
      for (const fieldName of Object.keys(req.files)) {
        const filesArray = req.files[fieldName];
        for (const file of filesArray) {
          await processFile(file);
          file.path = `/uploads/${file.filename}`;
        }
      }
    }

    next();
  } catch (error) {
    console.error(`[ERROR] Persisting upload to MongoDB failed: ${error.message}`);
    next(error);
  }
};

module.exports = { persistUploads };
