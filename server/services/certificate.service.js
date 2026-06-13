const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const os = require('os');
const Upload = require('../models/Upload');

const typeLabels = {
  completion: 'Certificate of Completion',
  recommendation: 'Letter of Recommendation',
  appreciation: 'Certificate of Appreciation'
};

const generatePDF = async ({ intern, type, certNo, performance, validFrom, validTo, qrCode }) => {
  const fileName = `${certNo}.pdf`;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    
    // Capture PDF output in memory
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      try {
        const pdfData = Buffer.concat(buffers);
        
        // 1. Save to MongoDB to support persistent access across Vercel serverless containers
        await Upload.findOneAndUpdate(
          { filename: fileName },
          { contentType: 'application/pdf', data: pdfData },
          { upsert: true }
        );

        // 2. Also try saving to local filesystem if not strictly serverless (for local development)
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

    const W = doc.page.width, H = doc.page.height;

    // Background gradient (deep navy)
    doc.rect(0, 0, W, H).fill('#0a0e1a');

    // Gold border
    doc.rect(20, 20, W - 40, H - 40).lineWidth(3).stroke('#ffd700');
    doc.rect(25, 25, W - 50, H - 50).lineWidth(1).stroke('#4f8ef7');

    // Header area
    doc.rect(0, 0, W, 80).fill('#1a237e');

    // Company name
    doc.fontSize(11).fillColor('#ffd700').font('Helvetica-Bold')
       .text('IED INDIA PVT LTD', 0, 15, { align: 'center', width: W });
    doc.fontSize(8).fillColor('#90caf9')
       .text('Internship Management System', 0, 32, { align: 'center', width: W });
    doc.fontSize(6).fillColor('#b0bec5')
       .text('Empowering Future Leaders Through Excellence', 0, 46, { align: 'center', width: W });

    // Certificate type title
    doc.fontSize(24).fillColor('#ffd700').font('Helvetica-Bold')
       .text(typeLabels[type] || 'Certificate', 0, 110, { align: 'center', width: W });

    // Decorative line
    doc.moveTo(W/2 - 150, 148).lineTo(W/2 + 150, 148).lineWidth(2).stroke('#4f8ef7');

    // Body text
    doc.fontSize(10).fillColor('#b0bec5').font('Helvetica')
       .text('This is to certify that', 0, 165, { align: 'center', width: W });

    doc.fontSize(22).fillColor('#ffffff').font('Helvetica-Bold')
       .text(intern.name, 0, 182, { align: 'center', width: W });

    doc.fontSize(10).fillColor('#b0bec5').font('Helvetica')
       .text(`has successfully completed the internship program at`, 0, 215, { align: 'center', width: W });

    doc.fontSize(13).fillColor('#4f8ef7').font('Helvetica-Bold')
       .text('IED India Pvt Ltd', 0, 232, { align: 'center', width: W });

    if (intern.department) {
      doc.fontSize(10).fillColor('#b0bec5').font('Helvetica')
         .text(`Department: ${intern.department}`, 0, 252, { align: 'center', width: W });
    }

    if (validFrom && validTo) {
      doc.fontSize(9).fillColor('#90caf9')
         .text(`Duration: ${new Date(validFrom).toDateString()} - ${new Date(validTo).toDateString()}`, 0, 270, { align: 'center', width: W });
    }

    if (performance) {
      doc.fontSize(9).fillColor('#ffd700')
         .text(`Performance: ${performance.toUpperCase()}`, 0, 288, { align: 'center', width: W });
    }

    // Certificate number
    doc.fontSize(7).fillColor('#607d8b')
       .text(`Certificate No: ${certNo}`, 50, H - 80);
    doc.text(`Issued: ${new Date().toDateString()}`, 50, H - 68);

    // QR Code (base64 image)
    if (qrCode && qrCode.startsWith('data:image')) {
      const qrBuffer = Buffer.from(qrCode.split(',')[1], 'base64');
      doc.image(qrBuffer, W - 110, H - 110, { width: 80 });
      doc.fontSize(6).fillColor('#607d8b').text('Scan to verify', W - 110, H - 28, { width: 80, align: 'center' });
    }

    // Signature line
    doc.moveTo(W/2 - 80, H - 70).lineTo(W/2 + 80, H - 70).lineWidth(1).stroke('#4f8ef7');
    doc.fontSize(8).fillColor('#90caf9').text('Authorized Signatory', 0, H - 62, { align: 'center', width: W });
    doc.fontSize(7).fillColor('#607d8b').text('IED India Pvt Ltd', 0, H - 50, { align: 'center', width: W });

    doc.end();
  });
};

module.exports = { generatePDF };
