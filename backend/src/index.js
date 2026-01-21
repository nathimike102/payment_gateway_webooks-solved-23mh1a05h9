require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { initDatabase } = require('./init');

// Import routes
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const refundRoutes = require('./routes/refunds');
const testRoutes = require('./routes/test');
const publicRoutes = require('./routes/public');
const webhookRoutes = require('./routes/webhooks');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Serve static files (SDK, etc.)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve frontend (for Vercel deployment)
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

// Register routes
app.use(healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', publicRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/refunds', refundRoutes);
app.use('/api/v1/test', testRoutes);
app.use('/api/v1/webhooks', webhookRoutes);

// SPA fallback: serve index.html for all non-API routes
app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, '..', '..', 'frontend', 'dist', 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            res.status(404).json({ error: 'Not Found' });
        }
    });
});

async function startServer() {
    try {
        // Initialize database
        await initDatabase();
        
        // Start server
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Payment Gateway API running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
