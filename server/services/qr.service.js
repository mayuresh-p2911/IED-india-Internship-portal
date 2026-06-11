const qrcode = require('qrcode');

const generateQR = async (data) => {
  try {
    const qrDataURL = await qrcode.toDataURL(data, {
      width: 200, margin: 2,
      color: { dark: '#1a237e', light: '#ffffff' }
    });
    return qrDataURL;
  } catch (err) {
    console.error('QR generation error:', err);
    return '';
  }
};

module.exports = { generateQR };
