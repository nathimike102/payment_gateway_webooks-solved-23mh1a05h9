const express = require('express');
const pool = require('../config/database');
const { generateOrderId } = require('../utils/idGenerator');

const router = express.Router();

// Create demo order (public - no auth required)
router.post('/orders/create-demo', async (req, res) => {
  try {
    const { amount, currency } = req.body;

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount < 100) {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST_ERROR',
          description: 'amount must be at least 100 paise (₹1.00)'
        }
      });
    }

    // Generate unique order ID
    let orderId = generateOrderId();
    let exists = true;
    while (exists) {
      const check = await pool.query('SELECT id FROM orders WHERE id = $1', [orderId]);
      if (check.rows.length === 0) {
        exists = false;
      } else {
        orderId = generateOrderId();
      }
    }

    // Create order without a merchant (demo order)
    const result = await pool.query(
      `INSERT INTO orders (id, merchant_id, amount, currency, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, amount, currency, status, created_at`,
      [
        orderId,
        '550e8400-e29b-41d4-a716-446655440000', // Demo merchant ID
        amount,
        currency || 'INR',
        'created'
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating demo order:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        description: 'Internal server error'
      }
    });
  }
});

// Get order details (public - no auth required)
router.get('/orders/:order_id/public', async (req, res) => {
  try {
    const { order_id } = req.params;

    const result = await pool.query(
      'SELECT id, merchant_id, amount, currency, status, created_at FROM orders WHERE id = $1',
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

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        description: 'Internal server error'
      }
    });
  }
});

// Get payment status (public - no auth required)
router.get('/payments/:payment_id/public', async (req, res) => {
  try {
    const { payment_id } = req.params;

    const result = await pool.query(
      'SELECT id, order_id, amount, currency, method, status, vpa, card_network, card_last4, error_code, error_description, created_at, updated_at FROM payments WHERE id = $1',
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
      created_at: payment.created_at,
      updated_at: payment.updated_at
    };

    if (payment.method === 'upi') {
      response.vpa = payment.vpa;
    } else if (payment.method === 'card') {
      response.card_network = payment.card_network;
      response.card_last4 = payment.card_last4;
    }

    if (payment.status === 'failed') {
      response.error_code = payment.error_code;
      response.error_description = payment.error_description;
    }

    res.json(response);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        description: 'Internal server error'
      }
    });
  }
});

module.exports = router;
