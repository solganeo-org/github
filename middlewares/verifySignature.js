const crypto = require('crypto');

module.exports = (req, res, buf, encoding) => {
    const signature = req.headers['x-hub-signature-256'];
    const secret = process.env.WEBHOOK_SECRET;

    // Vérifiez si la clé secrète est définie
    if (!secret) {
        console.error("Error: WEBHOOK_SECRET is not defined. Please set it in the environment variables.");
        res.status(403).send("Webhook secret is not configured.");
        return;
    }

    // Vérifiez si la signature existe
    if (!signature) {
        console.error("Error: Signature missing from headers.");
        res.status(403).send("Signature missing.");
        return;
    }

    try {
        // Créez le HMAC pour vérifier la signature
        const hmac = crypto.createHmac('sha256', secret);
        const digest = 'sha256=' + hmac.update(buf).digest('hex');

        // Vérification de la signature
        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
            console.error("Error: Signature mismatch.");
            res.status(403).send("Signature mismatch.");
        }
    } catch (error) {
        console.error("Error in signature verification:", error);
        res.status(403).send("Signature verification error.");
    }
};