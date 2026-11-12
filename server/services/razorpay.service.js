const https = require('https');
const crypto = require('crypto');

const getConfig = () => {
  const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  const parsedFee = Number(process.env.APPLICATION_FEE_INR);
  const feeInr = Number.isFinite(parsedFee) && parsedFee > 0 ? parsedFee : 99;
  const amountPaise = Math.round(feeInr * 100);

  return {
    keyId,
    keySecret,
    feeInr,
    amountPaise,
    currency: 'INR',
    isConfigured: Boolean(keyId && keySecret)
  };
};

const razorpayRequest = (method, path, payload = null) => {
  const { keyId, keySecret } = getConfig();
  if (!keyId || !keySecret) {
    return Promise.reject(new Error('Razorpay credentials are not configured on the server.'));
  }

  return new Promise((resolve, reject) => {
    const body = payload ? JSON.stringify(payload) : null;
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const req = https.request({
      hostname: 'api.razorpay.com',
      port: 443,
      path,
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {})
      },
      timeout: 15000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch (_) {}
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(parsed);
        } else {
          const msg = parsed?.error?.description || parsed?.error?.reason || `Razorpay API error (${res.statusCode})`;
          reject(new Error(msg));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error('Razorpay API request timed out'));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
};

const createOrder = async ({ receipt, notes = {} }) => {
  const { keyId, feeInr, amountPaise, currency } = getConfig();
  const order = await razorpayRequest('POST', '/v1/orders', {
    amount: amountPaise,
    currency,
    receipt: String(receipt || `ied_app_${Date.now()}`).slice(0, 40),
    notes
  });

  return {
    orderId: order.id,
    amount: order.amount,
    amountInr: feeInr,
    currency: order.currency || currency,
    keyId
  };
};

const verifySignature = ({ orderId, paymentId, signature }) => {
  const { keySecret } = getConfig();
  if (!keySecret || !orderId || !paymentId || !signature) return false;

  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const expectedBuf = Buffer.from(expected, 'utf8');
  const actualBuf = Buffer.from(String(signature).trim(), 'utf8');
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
};

module.exports = {
  getConfig,
  createOrder,
  verifySignature
};
