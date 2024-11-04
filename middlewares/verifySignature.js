const crypto = require('crypto');
const config = require('../config/config');

module.exports = (req, res, buf) => {
    req.rawBody = buf;
    const signature = req.headers['x-hub-signature-256'];

    if (!signature) {
        throw new Error('Signature manquante');
    }

    const hmac = crypto.createHmac('sha256', config.webhookSecret);
    const digest = 'sha256=' + hmac.update(buf).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
        throw new Error('Signature invalide');
    }
};