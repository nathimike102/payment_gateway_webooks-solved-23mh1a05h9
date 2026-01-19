const express = require('express');
const db = require('../db');
const { authenticateApiKey } = require('../middleware/auth');
const { generateRefundId } = require('../utils/idGenerator');
const { validateIdempotencyKey, saveIdempotencyKey } = require('../services/idempotency');
const { enqueueWebhook } = require('../services/webhooks');
const crypto = require('crypto');

const router = express.Router();

// Create a refund
router.post('/api/v1/refunds', authenticateApiKey, async (req, res) => {
    try {
        const { payment_id, amount, reason, idempotency_key } = req.body;
        const merchantId = req.merchant.id;

        // Validate idempotency key
        if (idempotency_key) {
            const existingResponse = await validateIdempotencyKey(merchantId, req.body);
            if (existingResponse) {
                return res.status(existingResponse.response_status_code).json(JSON.parse(existingResponse.response_body));
            }
        }

        // Verify payment exists and belongs to merchant
        const paymentResult = await db.query(
            'SELECT * FROM payments WHERE id = $1 AND merchant_id = $2',
            [payment_id, merchantId]
        );

        if (paymentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        const payment = paymentResult.rows[0];

        if (payment.status !== 'success') {
            return res.status(400).json({ error: 'Only successful payments can be refunded' });
        }

        // Verify order exists
        const orderResult = await db.query(
            'SELECT * FROM orders WHERE id = $1',
            [payment.order_id]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orderResult.rows[0];

        // Validate refund amount
        const refundAmount = amount || payment.amount;
        if (!refundAmount || refundAmount <= 0) {
            return res.status(400).json({ error: 'Refund amount must be greater than zero' });
        }

        const priorRefundsResult = await db.query(
            `SELECT COALESCE(SUM(amount), 0) AS total_refunded
             FROM refunds
             WHERE payment_id = $1 AND merchant_id = $2 AND status != 'failed'`,
            [payment_id, merchantId]
        );

        const alreadyRefunded = parseInt(priorRefundsResult.rows[0].total_refunded, 10) || 0;
        const remaining = payment.amount - alreadyRefunded;

        if (refundAmount > remaining) {
            return res.status(400).json({ error: 'Refund amount exceeds remaining refundable balance' });
        }

        // Create refund
        const refundId = generateRefundId();
        const refundResult = await db.query(
            `INSERT INTO refunds (id, payment_id, order_id, merchant_id, amount, currency, reason, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [refundId, payment_id, payment.order_id, merchantId, refundAmount, payment.currency, reason || 'Customer request', 'created']
        );

        const refund = refundResult.rows[0];

        // Enqueue webhook event
        await enqueueWebhook(merchantId, 'refund.created', refund.id, null, order.id);

        const response = {
            id: refund.id,
            payment_id: refund.payment_id,
            order_id: refund.order_id,
            amount: refund.amount,
            currency: refund.currency,
            reason: refund.reason,
            status: refund.status,
            created_at: refund.created_at
        };

        // Save idempotency key
        if (idempotency_key) {
            await saveIdempotencyKey(merchantId, req.body, 201, response);
        }

        res.status(201).json(response);
    } catch (error) {
        console.error('Refund creation failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all refunds for merchant
router.get('/api/v1/refunds', authenticateApiKey, async (req, res) => {
    try {
        const { limit = 50, skip = 0, payment_id } = req.query;
        const merchantId = req.merchant.id;

        let query = 'SELECT * FROM refunds WHERE merchant_id = $1';
        let params = [merchantId];
        let paramIndex = 2;

        if (payment_id) {
            query += ` AND payment_id = $${paramIndex}`;
            params.push(payment_id);
            paramIndex++;
        }

        query += ' ORDER BY created_at DESC LIMIT $' + paramIndex + ' OFFSET $' + (paramIndex + 1);
        params.push(parseInt(limit), parseInt(skip));

        const result = await db.query(query, params);

        const countResult = await db.query(
            'SELECT COUNT(*) as total FROM refunds WHERE merchant_id = $1' +
            (payment_id ? ' AND payment_id = $2' : ''),
            payment_id ? [merchantId, payment_id] : [merchantId]
        );

        res.json({
            count: result.rows.length,
            total: parseInt(countResult.rows[0].total),
            refunds: result.rows
        });
    } catch (error) {
        console.error('Fetch refunds failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get refund by ID
router.get('/api/v1/refunds/:id', authenticateApiKey, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM refunds WHERE id = $1 AND merchant_id = $2',
            [req.params.id, req.merchant.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Refund not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Fetch refund failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
