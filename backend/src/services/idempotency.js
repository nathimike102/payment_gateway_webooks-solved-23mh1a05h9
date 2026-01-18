const db = require('../db');
const crypto = require('crypto');

async function validateIdempotencyKey(merchantId, requestBody) {
    try {
        // Create hash of request body
        const requestHash = crypto.createHash('sha256')
            .update(JSON.stringify(requestBody))
            .digest('hex');

        const result = await db.query(
            'SELECT * FROM idempotency_keys WHERE merchant_id = $1 AND request_hash = $2',
            [merchantId, requestHash]
        );

        if (result.rows.length > 0) {
            return result.rows[0];
        }

        return null;
    } catch (error) {
        console.error('Idempotency key validation failed:', error);
        throw error;
    }
}

async function saveIdempotencyKey(merchantId, requestBody, statusCode, responseBody) {
    try {
        const id = generateIdempotencyKeyId();
        const requestHash = crypto.createHash('sha256')
            .update(JSON.stringify(requestBody))
            .digest('hex');

        await db.query(
            `INSERT INTO idempotency_keys (id, merchant_id, request_hash, response_status_code, response_body)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (merchant_id, request_hash) DO UPDATE 
             SET response_status_code = $4, response_body = $5`,
            [id, merchantId, requestHash, statusCode, JSON.stringify(responseBody)]
        );

        return id;
    } catch (error) {
        console.error('Idempotency key save failed:', error);
        throw error;
    }
}

function generateIdempotencyKeyId() {
    return 'idem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

module.exports = {
    validateIdempotencyKey,
    saveIdempotencyKey,
    generateIdempotencyKeyId
};
