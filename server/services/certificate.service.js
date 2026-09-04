const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Upload = require('../models/Upload');

function findAsset(subpath) {
  const possiblePaths = [
    path.join(__dirname, '..', subpath),
    path.join(__dirname, '../../client/public', subpath.replace(/^assets\//, '')),
    path.join(process.cwd(), 'server', subpath),
    path.join(process.cwd(), subpath),
    path.join(process.cwd(), 'client/public', subpath.replace(/^assets\//, '')),
    path.join(process.cwd(), 'client/dist', subpath.replace(/^assets\//, ''))
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(__dirname, '..', subpath);
}

const generatePDF = async ({ intern, certNo }) => {
  const fileName = `${certNo}.pdf`;
  const templatePath = findAsset('assets/certificate_clean_base.jpg');
  const fontPath = findAsset('assets/fonts/AlexBrush-Regular.ttf');

  return new Promise((resolve, reject) => {
    // 1024 x 682 exact pixel-matched dimensions
    const doc = new PDFDocument({
      size: [1024, 682],
      margin: 0
    });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      try {
        const pdfData = Buffer.concat(buffers);

        // Save to MongoDB for serverless persistence across Vercel invocations (if connected)
        const mongoose = require('mongoose');
        if (mongoose.connection && mongoose.connection.readyState === 1) {
          try {
            await Upload.findOneAndUpdate(
              { filename: fileName },
              { contentType: 'application/pdf', data: pdfData },
              { upsert: true }
            );
          } catch (dbErr) {
            console.warn('[WARN] Could not save PDF to MongoDB Uploads:', dbErr.message);
          }
        }

        // Also save to disk in persistent environments
        const isServerless = process.env.VERCEL || process.env.NODE_ENV === 'production' || __dirname.includes('/var/task');
        if (!isServerless) {
          const CERT_DIR = path.join(__dirname, '../uploads/certificates');
          if (!fs.existsSync(CERT_DIR)) fs.mkdirSync(CERT_DIR, { recursive: true });
          fs.writeFileSync(path.join(CERT_DIR, fileName), pdfData);
        }

        resolve(`uploads/certificates/${fileName}`);
      } catch (err) {
        reject(err);
      }
    });

    doc.on('error', reject);

    // 1. Draw 100% exact certificate background image
    if (fs.existsSync(templatePath)) {
      doc.image(templatePath, 0, 0, { width: 1024, height: 682 });
    }

    // 2. Set calligraphy font
    if (fs.existsSync(fontPath)) {
      doc.font(fontPath);
    } else {
      doc.font('Times-Italic');
    }

    // 3. Draw intern name
    const internName = (intern?.name || 'Intern Name').trim();
    let fontSize = 54;
    doc.fontSize(fontSize);

    // Dynamic scaling for long names
    while (doc.widthOfString(internName) > 470 && fontSize > 24) {
      fontSize -= 2;
      doc.fontSize(fontSize);
    }

    // Baseline calculation to align perfectly with the blue horizontal rule
    const textY = Math.round(350 - (fontSize * 0.95));

    doc.fontSize(fontSize)
       .fillColor('#092d76')
       .text(internName, 273, textY, {
         width: 491,
         align: 'center',
         lineBreak: false
       });

    doc.end();
  });
};

module.exports = { generatePDF };
