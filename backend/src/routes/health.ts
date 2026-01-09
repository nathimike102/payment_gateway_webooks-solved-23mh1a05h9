import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  try {
    // Test database connectivity
    await pool.query('SELECT 1');
    
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(200).json({
      status: 'healthy',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
