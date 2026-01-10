const express = require('express');
const db = require('../db');
const { authenticateApiKey } = require('../middleware/auth');
const { generateOrderId } = require('../utils/idGenerator');

const router = express.Router();

// Get all orders for merchant
router.get('/api/v1/orders', authenticateApiKey, async (req, res) => {
    try {
        const { limit = 50, skip = 0 } = req.query;
        
        const result = await db.query(
            `SELECT id, merchant_id, amount, currency, receipt, notes, status, created_at, updated_at
             FROM orders
             WHERE merchant_id = $1
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
            [req.merchant.id, parseInt(limit), parseInt(skip)]
        );

        const countResult = await db.query(
            'SELECT COUNT(*) as total FROM orders WHERE merchant_id = $1',
            [req.merchant.id]
        );

        res.json({
            count: result.rows.length,
            total: parseInt(countResult.rows[0].total),
            orders: result.rows.map(order => ({
                id: order.id,
                merchant_id: order.merchant_id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt,
                notes: order.notes,
                status: order.status,
                created_at: order.created_at,
                updated_at: order.updated_at
            }))
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            error: {
                code: 'SERVER_ERROR',
                description: 'Internal server error'
            }
        });
    }
});

// Create order
router.post('/api/v1/orders', authenticateApiKey, async (req, res) => {
    try {
        const { amount, currency, receipt, notes } = req.body;

        // Validate amount
        if (!amount || typeof amount !== 'number' || amount < 100) {
            return res.status(400).json({
                error: {
                    code: 'BAD_REQUEST_ERROR',
                    description: 'amount must be at least 100'
                }
            });
        }

        // Generate unique order ID
        let orderId = generateOrderId();
        let exists = true;
        while (exists) {
            const check = await db.query('SELECT id FROM orders WHERE id = $1', [orderId]);
            if (check.rows.length === 0) {
                exists = false;
            } else {
                orderId = generateOrderId();
            }
        }

        // Create order
        const result = await db.query(
            `INSERT INTO orders (id, merchant_id, amount, currency, receipt, notes, status, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             RETURNING id, merchant_id, amount, currency, receipt, notes, status, created_at`,
            [
                orderId,
                req.merchant.id,
                amount,
                currency || 'INR',
                receipt || null,
                notes ? JSON.stringify(notes) : null,
                'created'
            ]
        );

        const order = result.rows[0];
        
        res.status(201).json({
            id: order.id,
            merchant_id: order.merchant_id,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt,
            notes: order.notes || {},
            status: order.status,
            created_at: order.created_at.toISOString()
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            error: {
                code: 'SERVER_ERROR',
                description: 'Internal server error'
            }
        });
    }
});

// Get order
router.get('/api/v1/orders/:order_id', authenticateApiKey, async (req, res) => {
    try {
        const { order_id } = req.params;

        const result = await db.query(
            'SELECT * FROM orders WHERE id = $1 AND merchant_id = $2',
            [order_id, req.merchant.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND_ERROR',
                    description: 'Order not found'
                }
            });
        }

        const order = result.rows[0];
        
        res.json({
            id: order.id,
            merchant_id: order.merchant_id,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt,
            notes: order.notes || {},
            status: order.status,
            created_at: order.created_at.toISOString(),
            updated_at: order.updated_at.toISOString()
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            error: {
                code: 'SERVER_ERROR',
                description: 'Internal server error'
            }
        });
    }
});

// Get order public (no auth required)
router.get('/api/v1/orders/:order_id/public', async (req, res) => {
    try {
        const { order_id } = req.params;

        const result = await db.query(
            'SELECT id, amount, currency, status FROM orders WHERE id = $1',
            [order_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND_ERROR',
                    description: 'Order not found'
                }
            });
        }

        const order = result.rows[0];
        
        res.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            status: order.status
        });
    } catch (error) {
        console.error('Get order public error:', error);
        res.status(500).json({
            error: {
                code: 'SERVER_ERROR',
                description: 'Internal server error'
            }
        });
    }
});

module.exports = router;
