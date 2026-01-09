import fs from 'fs';
import path from 'path';
import pool from './db';

export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log('Initializing database schema...');
    
    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, '../schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    await client.query(schema);
    
    console.log('Database schema initialized successfully');
    
    // Seed test merchant
    await seedTestMerchant(client);
    
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function seedTestMerchant(client: any) {
  try {
    console.log('Seeding test merchant...');
    
    const testMerchantId = '550e8400-e29b-41d4-a716-446655440000';
    const testEmail = 'test@example.com';
    const testApiKey = 'key_test_abc123';
    const testApiSecret = 'secret_test_xyz789';
    
    // Check if test merchant already exists
    const checkResult = await client.query(
      'SELECT id FROM merchants WHERE email = $1',
      [testEmail]
    );
    
    if (checkResult.rows.length > 0) {
      console.log('Test merchant already exists, skipping seed');
      return;
    }
    
    // Insert test merchant
    await client.query(
      `INSERT INTO merchants (id, name, email, api_key, api_secret, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [testMerchantId, 'Test Merchant', testEmail, testApiKey, testApiSecret, true]
    );
    
    console.log('Test merchant seeded successfully');
    console.log(`  ID: ${testMerchantId}`);
    console.log(`  Email: ${testEmail}`);
    console.log(`  API Key: ${testApiKey}`);
    console.log(`  API Secret: ${testApiSecret}`);
    
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
      console.log('Test merchant already exists (unique constraint), skipping seed');
    } else {
      console.error('Error seeding test merchant:', error);
      throw error;
    }
  }
}
