const fs = require('fs');
const path = require('path');
const db = require('./db');

async function initDatabase() {
    try {
        console.log('Initializing database...');
        
        const schemaPath = path.join(__dirname, '..', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        await db.query(schema);
        
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization failed:', error);
        throw error;
    }
}

module.exports = { initDatabase };
