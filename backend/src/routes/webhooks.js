const express = require('express');
const db = require('../db');
const { authenticateApiKey } = require('../middleware/auth');
const { getWebhookLogs } = require('../services/webhooks');

const router = express.Router();

const isValidUrl = (value) => {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (error) {
        return false;
    }
};

// Get the configured webhook URL for the authenticated merchant
router.get('/api/v1/webhooks/config', authenticateApiKey, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT webhook_url FROM merchants WHERE id = $1',
            [req.merchant.id]
        );

        const webhookUrl = result.rows[0]?.webhook_url || '';
        res.json({ webhook_url: webhookUrl });
    } catch (error) {
        console.error('Fetch webhook config failed:', error);
        res.status(500).json({ error: 'Failed to fetch webhook config' });
    }
});

// Update webhook URL for the authenticated merchant
router.put('/api/v1/webhooks/config', authenticateApiKey, async (req, res) => {
    try {
        const { webhook_url } = req.body;

        if (!webhook_url || !isValidUrl(webhook_url)) {
            return res.status(400).json({ error: 'Valid webhook_url (http/https) is required' });
        }

        await db.query(
            'UPDATE merchants SET webhook_url = $1 WHERE id = $2',
            [webhook_url, req.merchant.id]
        );

        res.json({ webhook_url });
    } catch (error) {
        console.error('Update webhook config failed:', error);
        res.status(500).json({ error: 'Failed to update webhook config' });
    }
});

// Fetch recent webhook delivery logs for the merchant
router.get('/api/v1/webhooks/logs', authenticateApiKey, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const skip = parseInt(req.query.skip, 10) || 0;

        const logs = await getWebhookLogs(req.merchant.id, limit, skip);
        res.json({ count: logs.length, logs });
    } catch (error) {
        console.error('Fetch webhook logs failed:', error);
        res.status(500).json({ error: 'Failed to fetch webhook logs' });
    }
});

module.exports = router;