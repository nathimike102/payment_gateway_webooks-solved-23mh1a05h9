require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./init');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Routes will be added here

// Health check placeholder
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', database: 'connected', timestamp: new Date().toISOString() });
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
