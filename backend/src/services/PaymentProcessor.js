const config = require('../config/env');

class PaymentProcessor {
    static async processPayment(paymentId, method, db) {
        // Determine processing delay
        let delay;
        if (config.TEST_MODE) {
            delay = config.TEST_PROCESSING_DELAY;
        } else {
            delay = Math.floor(Math.random() * (config.PROCESSING_DELAY_MAX - config.PROCESSING_DELAY_MIN + 1)) + config.PROCESSING_DELAY_MIN;
        }
        
        // Wait for processing delay
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Determine success/failure
        let success;
        if (config.TEST_MODE) {
            success = config.TEST_PAYMENT_SUCCESS;
        } else {
            const successRate = method === 'upi' ? config.UPI_SUCCESS_RATE : config.CARD_SUCCESS_RATE;
            success = Math.random() < successRate;
        }
        
        // Update payment status
        if (success) {
            await db.query(
                'UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                ['success', paymentId]
            );
        } else {
            await db.query(
                'UPDATE payments SET status = $1, error_code = $2, error_description = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
                ['failed', 'PAYMENT_FAILED', 'Payment processing failed', paymentId]
            );
        }
    }
}

module.exports = PaymentProcessor;
