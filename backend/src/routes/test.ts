import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

// Get test merchant (for evaluation)
router.get('/test/merchant', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, email, api_key
       FROM merchants
       WHERE email = $1`,
      ['test@example.com']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND_ERROR',
          description: 'Test merchant not found'
        }
      });
    }

    const merchant = result.rows[0];

    res.status(200).json({
      id: merchant.id,
      email: merchant.email,
      api_key: merchant.api_key,
      seeded: true
    });
  } catch (error) {
    console.error('Error fetching test merchant:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Internal server error'
      }
    });
  }
});

export default router;
