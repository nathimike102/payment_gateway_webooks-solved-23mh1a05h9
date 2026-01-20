const express = require('express');
const AuthService = require('../services/AuthService');
const { sendSuccess, sendError } = require('../utils/response');
const bcrypt = require('bcrypt');

const router = express.Router();

// Register new merchant
router.post('/api/v1/auth/register', async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        // Validate input
        if (!name || !email || !password || !confirmPassword) {
            return sendError(res, 'All fields are required', 'BAD_REQUEST_ERROR', 400);
        }

        if (password !== confirmPassword) {
            return sendError(res, 'Passwords do not match', 'VALIDATION_ERROR', 400);
        }

        if (password.length < 6) {
            return sendError(res, 'Password must be at least 6 characters', 'VALIDATION_ERROR', 400);
        }

        // Register merchant
        const merchant = await AuthService.register(name, email, password);

        return sendSuccess(res, {
            message: 'Registration successful',
            merchant: {
                id: merchant.id,
                email: merchant.email,
                apiKey: merchant.api_key,
                apiSecret: merchant.api_secret
            }
        }, 201);
    } catch (error) {
        if (error.message === 'Email already registered') {
            return sendError(res, error.message, 'CONFLICT_ERROR', 409);
        }
        return sendError(res, error.message, 'INTERNAL_ERROR', 500);
    }
});

// Login merchant
router.post('/api/v1/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendError(res, 'Email and password are required', 'BAD_REQUEST_ERROR', 400);
        }

        const merchant = await AuthService.authenticate(email, password);

        return sendSuccess(res, {
            message: 'Login successful',
            merchant: {
                id: merchant.id,
                name: merchant.name,
                email: merchant.email,
                apiKey: merchant.api_key,
                apiSecret: merchant.api_secret
            }
        });
    } catch (error) {
        return sendError(res, error.message, 'AUTHENTICATION_ERROR', 401);
    }
});

// Seed test merchant (for production testing only)
router.post('/api/v1/auth/seed-test', async (req, res) => {
    try {
        const db = require('../db');
        const testMerchantId = '550e8400-e29b-41d4-a716-446655440000';
        
        // Check if already exists
        const existing = await db.query('SELECT id FROM merchants WHERE email = $1', ['test@example.com']);
        if (existing.rows.length > 0) {
            return res.json({ message: 'Test merchant already exists' });
        }
        
        // Create test merchant
        const passwordHash = await bcrypt.hash('test123', 10);
        const result = await db.query(
            `INSERT INTO merchants (id, name, email, password_hash, api_key, api_secret, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             RETURNING id, email`,
            [
                testMerchantId,
                'Test Merchant',
                'test@example.com',
                passwordHash,
                'key_test_abc123',
                'secret_test_xyz789'
            ]
        );
        
        res.json({ message: 'Test merchant created', merchant: result.rows[0] });
    } catch (error) {
        console.error('Seed error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
