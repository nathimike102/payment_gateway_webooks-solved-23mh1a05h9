import { Router, Response } from 'express';
import pool from '../db';
import { authenticateRequest, AuthRequest } from '../middleware/auth';
import { generateUniqueId } from '../utils/idGenerator';
import {
  validateVPA,
  validateCardNumber,
  detectCardNetwork,
  validateCardExpiry,
  getCardLast4
} from '../utils/validators';

const router = Router();

// Helper function to process payment with delay
async function processPayment(
  paymentId: string,
  method: string
): Promise<void> {
  // Get configuration from environment
  const testMode = process.env.TEST_MODE === 'true';
  const testPaymentSuccess = process.env.TEST_PAYMENT_SUCCESS !== 'false';
  const testProcessingDelay = parseInt(process.env.TEST_PROCESSING_DELAY || '1000', 10);
  
  const upiSuccessRate = parseFloat(process.env.UPI_SUCCESS_RATE || '0.90');
  const cardSuccessRate = parseFloat(process.env.CARD_SUCCESS_RATE || '0.95');
  const delayMin = parseInt(process.env.PROCESSING_DELAY_MIN || '5000', 10);
  const delayMax = parseInt(process.env.PROCESSING_DELAY_MAX || '10000', 10);
  
  // Determine delay
  let delay: number;
  if (testMode) {
    delay = testProcessingDelay;
  } else {
    delay = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;
  }
  
  // Wait for processing delay
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // Determine success/failure
  let isSuccess: boolean;
  if (testMode) {
    isSuccess = testPaymentSuccess;
  } else {
    const successRate = method === 'upi' ? upiSuccessRate : cardSuccessRate;
    isSuccess = Math.random() < successRate;
  }
  
  // Update payment status
  if (isSuccess) {
    await pool.query(
      `UPDATE payments 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      ['success', paymentId]
    );
  } else {
    await pool.query(
      `UPDATE payments 
       SET status = $1, error_code = $2, error_description = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4`,
      ['failed', 'PAYMENT_FAILED', 'Payment processing failed', paymentId]
    );
  }
}

// Create Payment
router.post('/payments', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { order_id, method, vpa, card } = req.body;
    const merchantId = req.merchantId;

    // Validate order exists and belongs to merchant
    const orderResult = await pool.query(
      'SELECT id, merchant_id, amount, currency FROM orders WHERE id = $1',
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

    if (order.merchant_id !== merchantId) {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST_ERROR',
          description: 'Order does not belong to merchant'
        }
      });
    }

    // Validate payment method
    if (method !== 'upi' && method !== 'card') {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST_ERROR',
          description: 'Invalid payment method'
        }
      });
    }

    let cardNetwork: string | null = null;
    let cardLast4: string | null = null;
    let vpaValue: string | null = null;

    // Validate UPI payment
    if (method === 'upi') {
      if (!vpa) {
        return res.status(400).json({
          error: {
            code: 'BAD_REQUEST_ERROR',
            description: 'VPA is required for UPI payments'
          }
        });
      }

      if (!validateVPA(vpa)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_VPA',
            description: 'Invalid VPA format'
          }
        });
      }

      vpaValue = vpa;
    }

    // Validate Card payment
    if (method === 'card') {
      if (!card || !card.number || !card.expiry_month || !card.expiry_year || !card.cvv || !card.holder_name) {
        return res.status(400).json({
          error: {
            code: 'BAD_REQUEST_ERROR',
            description: 'Card details are incomplete'
          }
        });
      }

      // Validate card number with Luhn algorithm
      if (!validateCardNumber(card.number)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_CARD',
            description: 'Invalid card number'
          }
        });
      }

      // Validate expiry date
      if (!validateCardExpiry(card.expiry_month, card.expiry_year)) {
        return res.status(400).json({
          error: {
            code: 'EXPIRED_CARD',
            description: 'Card has expired or invalid expiry date'
          }
        });
      }

      // Detect card network
      cardNetwork = detectCardNetwork(card.number);
      cardLast4 = getCardLast4(card.number);
    }

    // Generate unique payment ID
    const paymentId = await generateUniqueId('pay_', async (id) => {
      const result = await pool.query('SELECT id FROM payments WHERE id = $1', [id]);
      return result.rows.length > 0;
    });

    // Insert payment with status 'processing'
    const insertResult = await pool.query(
      `INSERT INTO payments (id, order_id, merchant_id, amount, currency, method, status, vpa, card_network, card_last4, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, order_id, merchant_id, amount, currency, method, status, vpa, card_network, card_last4, created_at`,
      [paymentId, order_id, merchantId, order.amount, order.currency, method, 'processing', vpaValue, cardNetwork, cardLast4]
    );

    const payment = insertResult.rows[0];

    // Process payment asynchronously (but synchronously for this deliverable)
    await processPayment(paymentId, method);

    // Fetch updated payment
    const updatedResult = await pool.query(
      'SELECT id, order_id, amount, currency, method, status, vpa, card_network, card_last4, created_at FROM payments WHERE id = $1',
      [paymentId]
    );

    const updatedPayment = updatedResult.rows[0];

    // Build response based on method
    const response: any = {
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
    console.error('Error creating payment:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Internal server error'
      }
    });
  }
});

// Get Payment
router.get('/payments/:payment_id', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { payment_id } = req.params;
    const merchantId = req.merchantId;

    const result = await pool.query(
      `SELECT id, order_id, merchant_id, amount, currency, method, status, vpa, 
              card_network, card_last4, error_code, error_description, created_at, updated_at
       FROM payments
       WHERE id = $1 AND merchant_id = $2`,
      [payment_id, merchantId]
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

    const response: any = {
      id: payment.id,
      order_id: payment.order_id,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      status: payment.status,
      created_at: payment.created_at.toISOString(),
      updated_at: payment.updated_at.toISOString()
    };

    if (payment.method === 'upi' && payment.vpa) {
      response.vpa = payment.vpa;
    } else if (payment.method === 'card') {
      if (payment.card_network) response.card_network = payment.card_network;
      if (payment.card_last4) response.card_last4 = payment.card_last4;
    }

    if (payment.error_code) {
      response.error_code = payment.error_code;
    }
    if (payment.error_description) {
      response.error_description = payment.error_description;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Internal server error'
      }
    });
  }
});

// Create Payment (Public endpoint for checkout)
router.post('/payments/public', async (req, res) => {
  try {
    const { order_id, method, vpa, card } = req.body;

    // Validate order exists
    const orderResult = await pool.query(
      'SELECT id, merchant_id, amount, currency FROM orders WHERE id = $1',
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
    const merchantId = order.merchant_id;

    // Validate payment method
    if (method !== 'upi' && method !== 'card') {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST_ERROR',
          description: 'Invalid payment method'
        }
      });
    }

    let cardNetwork: string | null = null;
    let cardLast4: string | null = null;
    let vpaValue: string | null = null;

    // Validate UPI payment
    if (method === 'upi') {
      if (!vpa) {
        return res.status(400).json({
          error: {
            code: 'BAD_REQUEST_ERROR',
            description: 'VPA is required for UPI payments'
          }
        });
      }

      if (!validateVPA(vpa)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_VPA',
            description: 'Invalid VPA format'
          }
        });
      }

      vpaValue = vpa;
    }

    // Validate Card payment
    if (method === 'card') {
      if (!card || !card.number || !card.expiry_month || !card.expiry_year || !card.cvv || !card.holder_name) {
        return res.status(400).json({
          error: {
            code: 'BAD_REQUEST_ERROR',
            description: 'Card details are incomplete'
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

      if (!validateCardExpiry(card.expiry_month, card.expiry_year)) {
        return res.status(400).json({
          error: {
            code: 'EXPIRED_CARD',
            description: 'Card has expired or invalid expiry date'
          }
        });
      }

      cardNetwork = detectCardNetwork(card.number);
      cardLast4 = getCardLast4(card.number);
    }

    // Generate unique payment ID
    const paymentId = await generateUniqueId('pay_', async (id) => {
      const result = await pool.query('SELECT id FROM payments WHERE id = $1', [id]);
      return result.rows.length > 0;
    });

    // Insert payment with status 'processing'
    await pool.query(
      `INSERT INTO payments (id, order_id, merchant_id, amount, currency, method, status, vpa, card_network, card_last4, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [paymentId, order_id, merchantId, order.amount, order.currency, method, 'processing', vpaValue, cardNetwork, cardLast4]
    );

    // Process payment asynchronously
    processPayment(paymentId, method).catch(err => {
      console.error('Error processing payment:', err);
    });

    // Return immediately with processing status
    const response: any = {
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
    console.error('Error creating payment:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Internal server error'
      }
    });
  }
});

// Get Payment (Public endpoint for checkout polling)
router.get('/payments/:payment_id/public', async (req, res) => {
  try {
    const { payment_id } = req.params;

    const result = await pool.query(
      `SELECT id, order_id, amount, currency, method, status, vpa, 
              card_network, card_last4, error_code, error_description, created_at, updated_at
       FROM payments
       WHERE id = $1`,
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

    const response: any = {
      id: payment.id,
      order_id: payment.order_id,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      status: payment.status,
      created_at: payment.created_at.toISOString(),
      updated_at: payment.updated_at.toISOString()
    };

    if (payment.method === 'upi' && payment.vpa) {
      response.vpa = payment.vpa;
    } else if (payment.method === 'card') {
      if (payment.card_network) response.card_network = payment.card_network;
      if (payment.card_last4) response.card_last4 = payment.card_last4;
    }

    if (payment.error_code) {
      response.error_code = payment.error_code;
    }
    if (payment.error_description) {
      response.error_description = payment.error_description;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Internal server error'
      }
    });
  }
});

export default router;
