require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./init');

// Import routes
const healthRoutes = require('./routes/health');
const orderRoutes = require('./routes/orders');
const testRoutes = require('./routes/test');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Register routes
app.use(healthRoutes);
app.use(orderRoutes);
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
