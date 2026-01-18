require('dotenv').config();
const db = require('./db');
const { webhookQueue, paymentQueue, refundQueue } = require('./queues');
const { generateHmacSignature } = require('./services/webhooks');

// Webhook job processor
webhookQueue.process(async (job) => {
    const { merchantId, eventType, paymentId, refundId, orderId } = job.data;

    try {
        // Fetch merchant webhook URL and secret
        const merchantResult = await db.query(
            'SELECT webhook_url, api_secret FROM merchants WHERE id = $1',
            [merchantId]
        );

        if (merchantResult.rows.length === 0 || !merchantResult.rows[0].webhook_url) {
            throw new Error('No webhook URL configured');
        }

        const { webhook_url, api_secret } = merchantResult.rows[0];

        // Fetch event data
        let eventData = {
            id: eventType === 'payment.created' ? paymentId : refundId,
            event: eventType,
            timestamp: new Date().toISOString()
        };

        if (eventType === 'payment.created' && paymentId) {
            const paymentResult = await db.query('SELECT * FROM payments WHERE id = $1', [paymentId]);
            if (paymentResult.rows.length > 0) {
                eventData = { ...eventData, ...paymentResult.rows[0] };
            }
        } else if (eventType === 'refund.created' && refundId) {
            const refundResult = await db.query('SELECT * FROM refunds WHERE id = $1', [refundId]);
            if (refundResult.rows.length > 0) {
                eventData = { ...eventData, ...refundResult.rows[0] };
            }
        }

        // Generate HMAC signature
        const signature = generateHmacSignature(eventData, api_secret);

        // Send webhook
        const response = await fetch(webhook_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': signature
            },
            body: JSON.stringify(eventData)
        });

        // Update webhook log
        await db.query(
            `UPDATE webhook_logs SET status = $1, response_status = $2, updated_at = CURRENT_TIMESTAMP
             WHERE merchant_id = $3 AND event_type = $4 AND payment_id = $5`,
            [response.ok ? 'delivered' : 'failed', response.status, merchantId, eventType, paymentId]
        );

        if (!response.ok) {
            throw new Error(`Webhook delivery failed with status ${response.status}`);
        }

        return { success: true, status: response.status };
    } catch (error) {
        console.error('Webhook job failed:', error);
        
        // Update webhook log with error
        try {
            await db.query(
                `UPDATE webhook_logs SET status = $1, error_message = $2, attempt_count = attempt_count + 1, updated_at = CURRENT_TIMESTAMP
                 WHERE merchant_id = $3`,
                ['failed', error.message, merchantId]
            );
        } catch (updateError) {
            console.error('Failed to update webhook log:', updateError);
        }

        throw error;
    }
});

// Payment job processor
paymentQueue.process(async (job) => {
    const { paymentId } = job.data;

    try {
        // Update payment status to processed
        const result = await db.query(
            'UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            ['processed', paymentId]
        );

        if (result.rows.length === 0) {
            throw new Error('Payment not found');
        }

        console.log('Payment processed:', paymentId);
        return { success: true, paymentId };
    } catch (error) {
        console.error('Payment processing failed:', error);
        throw error;
    }
});

// Refund job processor
refundQueue.process(async (job) => {
    const { refundId } = job.data;

    try {
        // Update refund status to processed
        const result = await db.query(
            'UPDATE refunds SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            ['processed', refundId]
        );

        if (result.rows.length === 0) {
            throw new Error('Refund not found');
        }

        console.log('Refund processed:', refundId);
        return { success: true, refundId };
    } catch (error) {
        console.error('Refund processing failed:', error);
        throw error;
    }
});

// Health check endpoint for job queue
async function getQueueStats() {
    try {
        const webhookStats = {
            queue: 'webhooks',
            waiting: await webhookQueue.getWaitingCount(),
            active: await webhookQueue.getActiveCount(),
            completed: await webhookQueue.getCompletedCount(),
            failed: await webhookQueue.getFailedCount()
        };

        const paymentStats = {
            queue: 'payments',
            waiting: await paymentQueue.getWaitingCount(),
            active: await paymentQueue.getActiveCount(),
            completed: await paymentQueue.getCompletedCount(),
            failed: await paymentQueue.getFailedCount()
        };

        const refundStats = {
            queue: 'refunds',
            waiting: await refundQueue.getWaitingCount(),
            active: await refundQueue.getActiveCount(),
            completed: await refundQueue.getCompletedCount(),
            failed: await refundQueue.getFailedCount()
        };

        return {
            webhooks: webhookStats,
            payments: paymentStats,
            refunds: refundStats
        };
    } catch (error) {
        console.error('Failed to get queue stats:', error);
        return null;
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing queues...');
    await webhookQueue.close();
    await paymentQueue.close();
    await refundQueue.close();
    process.exit(0);
});

// Start worker
async function startWorker() {
    try {
        console.log('Payment Gateway Worker started');
        console.log('Queues ready for job processing');
    } catch (error) {
        console.error('Worker startup failed:', error);
        process.exit(1);
    }
}

startWorker();

module.exports = { getQueueStats };
