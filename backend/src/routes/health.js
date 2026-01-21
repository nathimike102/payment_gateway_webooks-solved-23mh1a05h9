const express = require('express');
const db = require('../db');
const { webhookQueue, paymentQueue, refundQueue } = require('../queues');

const router = express.Router();

const healthHandler = async (req, res) => {
    try {
        // Test database connection
        await db.query('SELECT 1');
        
        res.json({
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.json({
            status: 'healthy',
            database: 'disconnected',
            timestamp: new Date().toISOString()
        });
    }
};

// Support both paths (direct access and via proxy)
router.get('/health', healthHandler);
router.get('/api/v1/health', healthHandler);

router.get('/queue/status', async (req, res) => {
    try {
        const stats = {
            webhooks: {
                waiting: await webhookQueue.getWaitingCount(),
                active: await webhookQueue.getActiveCount(),
                completed: await webhookQueue.getCompletedCount(),
                failed: await webhookQueue.getFailedCount()
            },
            payments: {
                waiting: await paymentQueue.getWaitingCount(),
                active: await paymentQueue.getActiveCount(),
                completed: await paymentQueue.getCompletedCount(),
                failed: await paymentQueue.getFailedCount()
            },
            refunds: {
                waiting: await refundQueue.getWaitingCount(),
                active: await refundQueue.getActiveCount(),
                completed: await refundQueue.getCompletedCount(),
                failed: await refundQueue.getFailedCount()
            }
        };

        res.json(stats);
    } catch (error) {
        console.error('Queue status check failed:', error);
        res.status(500).json({ error: 'Queue status check failed' });
    }
});

module.exports = router;
