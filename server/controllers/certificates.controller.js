const Certificate = require('../models/Certificate');
const User = require('../models/User');
const certService = require('../services/certificate.service');
const qrService = require('../services/qr.service');
const { v4: uuidv4 } = require('uuid');

const getCertificates = async (req, res) => {
  try {
    const query = req.user.role === 'intern' ? { internId: req.user._id } : {};
    const certs = await Certificate.find(query).populate('internId', 'name email department').populate('issuedBy', 'name');
    res.json({ success: true, certificates: certs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const generateCertificate = async (req, res) => {
  try {
    const { internId, type, performance, validFrom, validTo } = req.body;
    const intern = await User.findById(internId);
    if (!intern) return res.status(404).json({ success: false, message: 'Intern not found' });

    const certNo = `IED-${type.toUpperCase().slice(0,3)}-${uuidv4().slice(0, 8).toUpperCase()}`;
    const qrData = JSON.stringify({ certNo, intern: intern.name, type, issued: new Date().toISOString() });
    const qrCode = await qrService.generateQR(qrData);
    const pdfPath = await certService.generatePDF({ intern, type, certNo, performance, validFrom, validTo, qrCode });

    const cert = await Certificate.create({
      internId, type, certNo, issuedDate: new Date(),
      validFrom, validTo, department: intern.department,
      performance, qrCode, pdfPath, issuedBy: req.user._id
    });
    res.status(201).json({ success: true, certificate: cert });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const downloadCertificate = async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id).populate('internId', 'name department');
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });
    const path = require('path');
    const fs = require('fs');
    const filePath = path.join(__dirname, '..', cert.pdfPath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Certificate file not found. Please regenerate.' });
    }
    res.download(filePath, `${cert.internId.name}_${cert.type}_certificate.pdf`);
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const verifyCertificate = async (req, res) => {
  try {
    const cert = await Certificate.findOne({ certNo: req.params.certNo }).populate('internId', 'name email department');
    if (!cert || !cert.isActive) return res.status(404).json({ success: false, message: 'Invalid or revoked certificate' });
    res.json({ success: true, valid: true, certificate: cert });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getCertificates, generateCertificate, downloadCertificate, verifyCertificate };
