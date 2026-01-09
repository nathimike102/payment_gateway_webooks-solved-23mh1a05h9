import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './init';
import healthRouter from './routes/health';
import ordersRouter from './routes/orders';
import paymentsRouter from './routes/payments';
import testRouter from './routes/test';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/', healthRouter);
app.use('/api/v1', ordersRouter);
app.use('/api/v1', paymentsRouter);
app.use('/api/v1', testRouter);

// Placeholder route
app.get('/', (req, res) => {
  res.json({ message: 'Payment Gateway API' });
});

// Start server after database initialization
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
