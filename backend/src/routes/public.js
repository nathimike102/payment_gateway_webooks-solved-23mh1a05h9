const express = require('express');
const pool = require('../config/database');

const router = express.Router();

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
