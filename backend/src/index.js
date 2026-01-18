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

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Serve static files (SDK, etc.)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Register routes
app.use(healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', publicRoutes);
app.use(orderRoutes);
app.use(paymentRoutes);
app.use(refundRoutes);
app.use(testRoutes);

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
