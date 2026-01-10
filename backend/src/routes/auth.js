const express = require('express');
const AuthService = require('../services/AuthService');
const { sendSuccess, sendError } = require('../utils/response');

const router = express.Router();

// Register new merchant
router.post('/register', async (req, res) => {
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
router.post('/login', async (req, res) => {
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

module.exports = router;
