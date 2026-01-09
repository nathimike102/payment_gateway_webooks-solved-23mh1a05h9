import { Request, Response, NextFunction } from 'express';
import pool from '../db';

export interface AuthRequest extends Request {
  merchantId?: string;
}

export async function authenticateRequest(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    const apiSecret = req.headers['x-api-secret'] as string;

    if (!apiKey || !apiSecret) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_ERROR',
          description: 'Invalid API credentials'
        }
      });
    }

    // Verify credentials against database
    const result = await pool.query(
      'SELECT id, is_active FROM merchants WHERE api_key = $1 AND api_secret = $2',
      [apiKey, apiSecret]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_ERROR',
          description: 'Invalid API credentials'
        }
      });
    }

    const merchant = result.rows[0];

    if (!merchant.is_active) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_ERROR',
          description: 'Merchant account is inactive'
        }
      });
    }

    // Attach merchant ID to request
    req.merchantId = merchant.id;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Internal server error'
      }
    });
  }
}
