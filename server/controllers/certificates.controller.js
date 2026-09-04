const Certificate = require('../models/Certificate');
const User = require('../models/User');
const certService = require('../services/certificate.service');
const qrService = require('../services/qr.service');
const Upload = require('../models/Upload');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const getCertificates = async (req, res) => {
  try {
    const query = req.user.role === 'intern' ? { internId: req.user._id } : {};
    const certs = await Certificate.find(query)
      .populate('internId', 'name email department')
      .populate('issuedBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, certificates: certs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const generateCertificate = async (req, res) => {
  try {
    let { internId, type, performance, validFrom, validTo } = req.body;

    // If an intern is calling generate, they can only generate for themselves
    if (req.user.role === 'intern') {
      internId = req.user._id;
    }

    if (!internId) {
      return res.status(400).json({ success: false, message: 'Intern ID is required' });
    }

    const intern = await User.findById(internId);
    if (!intern) {
      return res.status(404).json({ success: false, message: 'Intern not found' });
    }

    type = type || 'completion';
    performance = performance || 'good';

    const cleanCode = uuidv4().slice(0, 5).toUpperCase();
    const certNo = `IEDIN/INT/2026/${cleanCode}`;

    const qrData = JSON.stringify({
      certNo,
      intern: intern.name,
      type,
      issued: new Date().toISOString()
    });
    const qrCode = await qrService.generateQR(qrData);

    // Generate the PDF using the official IED India template
    const pdfPath = await certService.generatePDF({
      intern,
      type,
      certNo,
      performance,
      validFrom,
      validTo,
      qrCode
    });

    // If a certificate for this intern and type already exists, update it
    let cert = await Certificate.findOne({ internId: intern._id, type });
    if (cert) {
      cert.certNo = certNo;
      cert.certificateNo = certNo;
      cert.issuedDate = new Date();
      cert.validFrom = validFrom || cert.validFrom;
      cert.validTo = validTo || cert.validTo;
      cert.department = intern.department || cert.department;
      cert.performance = performance;
      cert.qrCode = qrCode;
      cert.pdfPath = pdfPath;
      cert.issuedBy = req.user._id;
      cert.isActive = true;
      await cert.save();
    } else {
      cert = await Certificate.create({
        internId: intern._id,
        type,
        certNo,
        certificateNo: certNo,
        issuedDate: new Date(),
        validFrom,
        validTo,
        department: intern.department || '',
        performance,
        qrCode,
        pdfPath,
        issuedBy: req.user._id
      });
    }

    const populatedCert = await Certificate.findById(cert._id)
      .populate('internId', 'name email department')
      .populate('issuedBy', 'name');

    res.status(201).json({ success: true, certificate: populatedCert });
  } catch (err) {
    console.error('generateCertificate error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const downloadCertificate = async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id).populate('internId', 'name department');
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    // Interns can only download their own certificates
    if (req.user.role === 'intern' && cert.internId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to download this certificate' });
    }

    const certCode = cert.certNo || cert.certificateNo || 'IEDIN-INT-2026';
    const filename = `${certCode}.pdf`;

    // Always ensure the PDF exists in MongoDB Upload collection using the official template
    let dbFile = await Upload.findOne({ filename });
    if (!dbFile) {
      await certService.generatePDF({
        intern: cert.internId,
        type: cert.type,
        certNo: certCode,
        performance: cert.performance,
        validFrom: cert.validFrom,
        validTo: cert.validTo,
        qrCode: cert.qrCode
      });
      dbFile = await Upload.findOne({ filename });
    }

    const internName = cert.internId ? cert.internId.name : 'Intern';
    const cleanName = internName.replace(/[^a-zA-Z0-9_-]/g, '_');

    if (dbFile) {
      res.set('Content-Type', 'application/pdf');
      res.set('Content-Disposition', `attachment; filename="${cleanName}_Internship_Certificate.pdf"`);
      return res.send(dbFile.data);
    }

    const filePath = path.join(__dirname, '..', cert.pdfPath);
    if (fs.existsSync(filePath)) {
      return res.download(filePath, `${cleanName}_Internship_Certificate.pdf`);
    }

    res.status(404).json({ success: false, message: 'Certificate file could not be retrieved' });
  } catch (err) {
    console.error('downloadCertificate error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const verifyCertificate = async (req, res) => {
  try {
    const { certNo } = req.params;
    const cert = await Certificate.findOne({
      $or: [{ certNo }, { certificateNo: certNo }]
    }).populate('internId', 'name email department');

    if (!cert || !cert.isActive) {
      return res.status(404).json({ success: false, message: 'Invalid or revoked certificate' });
    }
    res.json({ success: true, valid: true, certificate: cert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getCertificates,
  generateCertificate,
  downloadCertificate,
  verifyCertificate
};
