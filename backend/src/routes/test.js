const express = require('express');
const db = require('../db');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Initialize database schema
router.post('/api/v1/test/init-db', async (req, res) => {
    try {
        // Read schema.sql
        const schemaPath = path.join(__dirname, '../../schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Execute schema
        await db.query(schema);
        
        res.json({
            message: 'Database schema initialized successfully',
            status: 'success'
        });
    } catch (error) {
        console.error('DB init error:', error);
        res.status(500).json({
            error: {
                code: 'SERVER_ERROR',
                description: error.message
            }
        });
    }
});

router.get('/api/v1/test/merchant', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, email, api_key FROM merchants WHERE email = $1',
            ['test@example.com']
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND_ERROR',
                    description: 'Test merchant not found'
                }
            });
        }

        const merchant = result.rows[0];
        
        res.json({
            id: merchant.id,
            email: merchant.email,
            api_key: merchant.api_key,
            seeded: true
        });
    } catch (error) {
        console.error('Test merchant error:', error);
        res.status(500).json({
            error: {
                code: 'SERVER_ERROR',
                description: 'Internal server error'
            }
        });
    }
});

module.exports = router;
