import { Router, Response } from 'express';
import pool from '../db';
import { authenticateRequest, AuthRequest } from '../middleware/auth';
import { generateUniqueId } from '../utils/idGenerator';

const router = Router();

// Create Order
router.post('/orders', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;
    const merchantId = req.merchantId;

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
    const orderId = await generateUniqueId('order_', async (id) => {
      const result = await pool.query('SELECT id FROM orders WHERE id = $1', [id]);
      return result.rows.length > 0;
    });

    // Insert order into database
    const result = await pool.query(
      `INSERT INTO orders (id, merchant_id, amount, currency, receipt, notes, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, merchant_id, amount, currency, receipt, notes, status, 
                 created_at, updated_at`,
      [orderId, merchantId, amount, currency, receipt || null, notes ? JSON.stringify(notes) : null, 'created']
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
    console.error('Error creating order:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Internal server error'
      }
    });
  }
});

// Get Order
router.get('/orders/:order_id', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { order_id } = req.params;
    const merchantId = req.merchantId;

    const result = await pool.query(
      `SELECT id, merchant_id, amount, currency, receipt, notes, status, 
              created_at, updated_at
       FROM orders
       WHERE id = $1 AND merchant_id = $2`,
      [order_id, merchantId]
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

    res.status(200).json({
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
    console.error('Error fetching order:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Internal server error'
      }
    });
  }
});

// Get Order (Public endpoint for checkout)
router.get('/orders/:order_id/public', async (req: Request, res: Response) => {
  try {
    const { order_id } = req.params;

    const result = await pool.query(
      `SELECT id, merchant_id, amount, currency, status, created_at
       FROM orders
       WHERE id = $1`,
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

    res.status(200).json({
      id: order.id,
      merchant_id: order.merchant_id,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      created_at: order.created_at.toISOString()
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Internal server error'
      }
    });
  }
});

export default router;
