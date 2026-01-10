const { generatePaymentId } = require('../utils/idGenerator');

class PaymentService {
    static async createPayment(orderId, merchantId, amount, currency, method, vpaValue, cardNetwork, cardLast4, db) {
        let paymentId = generatePaymentId();
        let isUnique = false;

        while (!isUnique) {
            const existing = await db.query('SELECT id FROM payments WHERE id = $1', [paymentId]);
            if (existing.rows.length === 0) {
                isUnique = true;
            } else {
                paymentId = generatePaymentId();
            }
        }

        const result = await db.query(
            `INSERT INTO payments (id, order_id, merchant_id, amount, currency, method, status, vpa, card_network, card_last4, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             RETURNING id, order_id, amount, currency, method, status, vpa, card_network, card_last4, created_at`,
            [paymentId, orderId, merchantId, amount, currency, method, 'processing', vpaValue, cardNetwork, cardLast4]
        );

        return result.rows[0];
    }

    static async getPayment(paymentId, db) {
        const result = await db.query(
            'SELECT * FROM payments WHERE id = $1',
            [paymentId]
        );

        return result.rows[0] || null;
    }
}

module.exports = PaymentService;
