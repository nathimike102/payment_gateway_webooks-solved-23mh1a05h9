const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/health', async (req, res) => {
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
});

module.exports = router;
