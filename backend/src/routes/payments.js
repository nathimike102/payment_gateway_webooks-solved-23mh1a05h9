const express = require('express');
const db = require('../db');
const { authenticateApiKey } = require('../middleware/auth');
const { generatePaymentId } = require('../utils/idGenerator');
const {
    validateVPA,
    validateCardNumber,
    detectCardNetwork,
    validateExpiry
} = require('../utils/validators');

const router = express.Router();

// Helper function to process payment
async function processPayment(paymentId, method) {
    // Get configuration from environment
    const testMode = process.env.TEST_MODE === 'true';
    const testPaymentSuccess = process.env.TEST_PAYMENT_SUCCESS !== 'false';
    const testProcessingDelay = parseInt(process.env.TEST_PROCESSING_DELAY) || 1000;
    
    // Determine processing delay
    let delay;
    if (testMode) {
        delay = testProcessingDelay;
    } else {
        const minDelay = parseInt(process.env.PROCESSING_DELAY_MIN) || 5000;
        const maxDelay = parseInt(process.env.PROCESSING_DELAY_MAX) || 10000;
        delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
    }
    
    // Wait for processing delay
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Determine success/failure
    let success;
    if (testMode) {
        success = testPaymentSuccess;
    } else {
        const successRate = method === 'upi' 
            ? parseFloat(process.env.UPI_SUCCESS_RATE) || 0.90
            : parseFloat(process.env.CARD_SUCCESS_RATE) || 0.95;
        success = Math.random() < successRate;
    }
    
    // Update payment status
    if (success) {
        await db.query(
            'UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['success', paymentId]
        );
    } else {
        await db.query(
            `UPDATE payments SET status = $1, error_code = $2, error_description = $3, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $4`,
            ['failed', 'PAYMENT_FAILED', 'Payment processing failed', paymentId]
        );
    }
}

// Create payment
router.post('/api/v1/payments', authenticateApiKey, async (req, res) => {
    try {
        const { order_id, method, vpa, card } = req.body;

        // Validate order exists and belongs to merchant
        const orderResult = await db.query(
            'SELECT * FROM orders WHERE id = $1 AND merchant_id = $2',
            [order_id, req.merchant.id]
        );

        if (orderResult.rows.length === 0) {
            return res.status(400).json({
                error: {
                    code: 'BAD_REQUEST_ERROR',
                    description: 'Order not found or does not belong to merchant'
                }
            });
        }

        const order = orderResult.rows[0];

        // Validate based on payment method
        let cardNetwork = null;
        let cardLast4 = null;
        let vpaValue = null;

        if (method === 'upi') {
            if (!vpa || !validateVPA(vpa)) {
                return res.status(400).json({
                    error: {
                        code: 'INVALID_VPA',
                        description: 'Invalid VPA format'
                    }
                });
            }
            vpaValue = vpa;
        } else if (method === 'card') {
            if (!card || !card.number || !card.expiry_month || !card.expiry_year || !card.cvv || !card.holder_name) {
                return res.status(400).json({
                    error: {
                        code: 'BAD_REQUEST_ERROR',
                        description: 'Missing required card fields'
                    }
                });
            }

            // Validate card number
            if (!validateCardNumber(card.number)) {
                return res.status(400).json({
                    error: {
                        code: 'INVALID_CARD',
                        description: 'Invalid card number'
                    }
                });
            }

            // Validate expiry
            if (!validateExpiry(card.expiry_month, card.expiry_year)) {
                return res.status(400).json({
                    error: {
                        code: 'EXPIRED_CARD',
                        description: 'Card has expired or invalid expiry date'
                    }
                });
            }

            // Detect card network
            cardNetwork = detectCardNetwork(card.number);

            // Extract last 4 digits
            const cleaned = card.number.replace(/[\s-]/g, '');
            cardLast4 = cleaned.slice(-4);
        } else {
            return res.status(400).json({
                error: {
                    code: 'BAD_REQUEST_ERROR',
                    description: 'Invalid payment method'
                }
            });
        }

        // Generate unique payment ID
        let paymentId = generatePaymentId();
        let exists = true;
        while (exists) {
            const check = await db.query('SELECT id FROM payments WHERE id = $1', [paymentId]);
            if (check.rows.length === 0) {
                exists = false;
            } else {
                paymentId = generatePaymentId();
            }
        }

        // Create payment record with status 'processing'
        const result = await db.query(
            `INSERT INTO payments (id, order_id, merchant_id, amount, currency, method, status, vpa, card_network, card_last4, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             RETURNING id, order_id, amount, currency, method, status, vpa, card_network, card_last4, created_at`,
            [
                paymentId,
                order_id,
                req.merchant.id,
                order.amount,
                order.currency,
                method,
                'processing',
                vpaValue,
                cardNetwork,
                cardLast4
            ]
        );

        const payment = result.rows[0];

        // Process payment synchronously
        await processPayment(paymentId, method);

        // Fetch updated payment
        const updatedResult = await db.query('SELECT * FROM payments WHERE id = $1', [paymentId]);
        const updatedPayment = updatedResult.rows[0];

        // Build response
        const response = {
            id: updatedPayment.id,
            order_id: updatedPayment.order_id,
            amount: updatedPayment.amount,
            currency: updatedPayment.currency,
            method: updatedPayment.method,
            status: updatedPayment.status,
            created_at: updatedPayment.created_at.toISOString()
        };

        if (method === 'upi') {
            response.vpa = updatedPayment.vpa;
        } else if (method === 'card') {
            response.card_network = updatedPayment.card_network;
            response.card_last4 = updatedPayment.card_last4;
        }

        res.status(201).json(response);
    } catch (error) {
        console.error('Create payment error:', error);
        res.status(500).json({
            error: {
                code: 'SERVER_ERROR',
                description: 'Internal server error'
            }
        });
    }
});

// Get payment
router.get('/api/v1/payments/:payment_id', authenticateApiKey, async (req, res) => {
    try {
        const { payment_id } = req.params;

        const result = await db.query(
            'SELECT * FROM payments WHERE id = $1 AND merchant_id = $2',
            [payment_id, req.merchant.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND_ERROR',
                    description: 'Payment not found'
                }
            });
        }

        const payment = result.rows[0];

        const response = {
            id: payment.id,
            order_id: payment.order_id,
            amount: payment.amount,
            currency: payment.currency,
            method: payment.method,
            status: payment.status,
            created_at: payment.created_at.toISOString(),
            updated_at: payment.updated_at.toISOString()
        };

        if (payment.method === 'upi') {
            response.vpa = payment.vpa;
        } else if (payment.method === 'card') {
            response.card_network = payment.card_network;
            response.card_last4 = payment.card_last4;
        }

        if (payment.error_code) {
            response.error_code = payment.error_code;
            response.error_description = payment.error_description;
        }

        res.json(response);
    } catch (error) {
        console.error('Get payment error:', error);
        res.status(500).json({
            error: {
                code: 'SERVER_ERROR',
                description: 'Internal server error'
            }
        });
    }
});

// Create payment public (no auth required)
router.post('/api/v1/payments/public', async (req, res) => {
    try {
        const { order_id, method, vpa, card } = req.body;

        // Validate order exists
        const orderResult = await db.query(
            'SELECT * FROM orders WHERE id = $1',
            [order_id]
        );

        if (orderResult.rows.length === 0) {
            return res.status(400).json({
                error: {
                    code: 'BAD_REQUEST_ERROR',
                    description: 'Order not found'
                }
            });
        }

        const order = orderResult.rows[0];

        // Validate based on payment method
        let cardNetwork = null;
        let cardLast4 = null;
        let vpaValue = null;

        if (method === 'upi') {
            if (!vpa || !validateVPA(vpa)) {
                return res.status(400).json({
                    error: {
                        code: 'INVALID_VPA',
                        description: 'Invalid VPA format'
                    }
                });
            }
            vpaValue = vpa;
        } else if (method === 'card') {
            if (!card || !card.number || !card.expiry_month || !card.expiry_year || !card.cvv || !card.holder_name) {
                return res.status(400).json({
                    error: {
                        code: 'BAD_REQUEST_ERROR',
                        description: 'Missing required card fields'
                    }
                });
            }

            if (!validateCardNumber(card.number)) {
                return res.status(400).json({
                    error: {
                        code: 'INVALID_CARD',
                        description: 'Invalid card number'
                    }
                });
            }

            if (!validateExpiry(card.expiry_month, card.expiry_year)) {
                return res.status(400).json({
                    error: {
                        code: 'EXPIRED_CARD',
                        description: 'Card has expired or invalid expiry date'
                    }
                });
            }

            cardNetwork = detectCardNetwork(card.number);
            const cleaned = card.number.replace(/[\s-]/g, '');
            cardLast4 = cleaned.slice(-4);
        } else {
            return res.status(400).json({
                error: {
                    code: 'BAD_REQUEST_ERROR',
                    description: 'Invalid payment method'
                }
            });
        }

        // Generate unique payment ID
        let paymentId = generatePaymentId();
        let exists = true;
        while (exists) {
            const check = await db.query('SELECT id FROM payments WHERE id = $1', [paymentId]);
            if (check.rows.length === 0) {
                exists = false;
            } else {
                paymentId = generatePaymentId();
            }
        }

        // Create payment record
        await db.query(
            `INSERT INTO payments (id, order_id, merchant_id, amount, currency, method, status, vpa, card_network, card_last4, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [
                paymentId,
                order_id,
                order.merchant_id,
                order.amount,
                order.currency,
                method,
                'processing',
                vpaValue,
                cardNetwork,
                cardLast4
            ]
        );

        // Process payment asynchronously (don't wait)
        processPayment(paymentId, method).catch(err => {
            console.error('Payment processing error:', err);
        });

        // Return immediately with processing status
        const response = {
            id: paymentId,
            order_id: order_id,
            amount: order.amount,
            currency: order.currency,
            method: method,
            status: 'processing',
            created_at: new Date().toISOString()
        };

        if (method === 'upi') {
            response.vpa = vpaValue;
        } else if (method === 'card') {
            response.card_network = cardNetwork;
            response.card_last4 = cardLast4;
        }

        res.status(201).json(response);
    } catch (error) {
        console.error('Create payment public error:', error);
        res.status(500).json({
            error: {
                code: 'SERVER_ERROR',
                description: 'Internal server error'
            }
        });
    }
});

// Get payment public (no auth, for polling)
router.get('/api/v1/payments/:payment_id/public', async (req, res) => {
    try {
        const { payment_id } = req.params;

        const result = await db.query(
            'SELECT * FROM payments WHERE id = $1',
            [payment_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND_ERROR',
                    description: 'Payment not found'
                }
            });
        }

        const payment = result.rows[0];

        const response = {
            id: payment.id,
            order_id: payment.order_id,
            amount: payment.amount,
            currency: payment.currency,
            method: payment.method,
            status: payment.status,
            created_at: payment.created_at.toISOString(),
            updated_at: payment.updated_at.toISOString()
        };

        if (payment.method === 'upi') {
            response.vpa = payment.vpa;
        } else if (payment.method === 'card') {
            response.card_network = payment.card_network;
            response.card_last4 = payment.card_last4;
        }

        if (payment.error_code) {
            response.error_code = payment.error_code;
            response.error_description = payment.error_description;
        }

        res.json(response);
    } catch (error) {
        console.error('Get payment public error:', error);
        res.status(500).json({
            error: {
                code: 'SERVER_ERROR',
                description: 'Internal server error'
            }
        });
    }
});

module.exports = router;
