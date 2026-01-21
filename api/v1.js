// API v1 serverless function wrapper for Vercel
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Import backend modules
const db = require('../backend/src/db');
const authRoutes = require('../backend/src/routes/auth');
const paymentsRoutes = require('../backend/src/routes/payments');
const ordersRoutes = require('../backend/src/routes/orders');
const publicRoutes = require('../backend/src/routes/public');
const testRoutes = require('../backend/src/routes/test');
const webhooksRoutes = require('../backend/src/routes/webhooks');
const refundsRoutes = require('../backend/src/routes/refunds');
const healthRoutes = require('../backend/src/routes/health');

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

// Routes - each route file handles the /api/v1/* paths
app.use(authRoutes);
app.use(paymentsRoutes);
app.use(ordersRoutes);
app.use(publicRoutes);
app.use(testRoutes);
app.use(webhooksRoutes);
app.use(refundsRoutes);
app.use(healthRoutes);

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
