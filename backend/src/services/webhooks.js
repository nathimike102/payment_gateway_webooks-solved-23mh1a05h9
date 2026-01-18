const db = require('../db');
const crypto = require('crypto');

async function enqueueWebhook(merchantId, eventType, paymentId = null, refundId = null, orderId = null) {
    try {
        // Fetch merchant webhook URL
        const merchantResult = await db.query(
            'SELECT webhook_url FROM merchants WHERE id = $1',
            [merchantId]
        );

        if (merchantResult.rows.length === 0 || !merchantResult.rows[0].webhook_url) {
            console.log('No webhook URL configured for merchant:', merchantId);
            return null;
        }

        const webhookUrl = merchantResult.rows[0].webhook_url;
        const webhookId = generateWebhookId();

        // Create webhook log entry
        const result = await db.query(
            `INSERT INTO webhook_logs (id, merchant_id, event_type, payment_id, refund_id, order_id, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [webhookId, merchantId, eventType, paymentId, refundId, orderId, 'pending']
        );

        // TODO: This should be enqueued to a job processor (Bull, Celery, etc.)
        // For now, we'll just log it
        console.log('Webhook enqueued:', webhookId, eventType);

        return result.rows[0];
    } catch (error) {
        console.error('Webhook enqueue failed:', error);
        throw error;
    }
}

async function getWebhookLogs(merchantId, limit = 50, skip = 0) {
    try {
        const result = await db.query(
            'SELECT * FROM webhook_logs WHERE merchant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
            [merchantId, limit, skip]
        );

        return result.rows;
    } catch (error) {
        console.error('Fetch webhook logs failed:', error);
        throw error;
    }
}

async function updateWebhookLog(webhookId, status, responseStatus = null, responseBody = null, errorMessage = null) {
    try {
        const result = await db.query(
            `UPDATE webhook_logs 
             SET status = $1, response_status = $2, response_body = $3, error_message = $4, updated_at = CURRENT_TIMESTAMP
             WHERE id = $5
             RETURNING *`,
            [status, responseStatus, responseBody, errorMessage, webhookId]
        );

        return result.rows[0];
    } catch (error) {
        console.error('Update webhook log failed:', error);
        throw error;
    }
}

function generateWebhookId() {
    return 'wh_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateHmacSignature(payload, secret) {
    return crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
}

function verifyWebhookSignature(payload, signature, secret) {
    const expectedSignature = generateHmacSignature(payload, secret);
    return signature === expectedSignature;
}

module.exports = {
    enqueueWebhook,
    getWebhookLogs,
    updateWebhookLog,
    generateWebhookId,
    generateHmacSignature,
    verifyWebhookSignature
};
