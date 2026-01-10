module.exports = {
    PORT: process.env.PORT || 8000,
    DATABASE_URL: process.env.DATABASE_URL,
    
    // Test configuration
    TEST_MODE: process.env.TEST_MODE === 'true',
    TEST_PAYMENT_SUCCESS: process.env.TEST_PAYMENT_SUCCESS !== 'false',
    TEST_PROCESSING_DELAY: parseInt(process.env.TEST_PROCESSING_DELAY) || 1000,
    
    // Payment rates
    UPI_SUCCESS_RATE: parseFloat(process.env.UPI_SUCCESS_RATE) || 0.90,
    CARD_SUCCESS_RATE: parseFloat(process.env.CARD_SUCCESS_RATE) || 0.95,
    
    // Processing delays
    PROCESSING_DELAY_MIN: parseInt(process.env.PROCESSING_DELAY_MIN) || 5000,
    PROCESSING_DELAY_MAX: parseInt(process.env.PROCESSING_DELAY_MAX) || 10000,
    
    // Test merchant
    TEST_MERCHANT_ID: '550e8400-e29b-41d4-a716-446655440000',
    TEST_MERCHANT_EMAIL: process.env.TEST_MERCHANT_EMAIL || 'test@example.com',
    TEST_API_KEY: process.env.TEST_API_KEY || 'key_test_abc123',
    TEST_API_SECRET: process.env.TEST_API_SECRET || 'secret_test_xyz789',
};
