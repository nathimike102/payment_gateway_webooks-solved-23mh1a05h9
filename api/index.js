const express = require('express');
const cors = require('cors');
const db = require('../src/db');
const authRoutes = require('../src/routes/auth');
const paymentsRoutes = require('../src/routes/payments');
const ordersRoutes = require('../src/routes/orders');
const publicRoutes = require('../src/routes/public');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Api-Key', 'X-Api-Secret', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: db.pool ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Routes
app.use(authRoutes);
app.use(paymentsRoutes);
app.use(ordersRoutes);
app.use(publicRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      description: err.message || 'An error occurred'
    }
  });
});

module.exports = app;
