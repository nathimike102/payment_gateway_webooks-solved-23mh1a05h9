const { generateOrderId } = require('../utils/idGenerator');

class OrderService {
    static async createOrder(merchantId, amount, currency, receipt, notes, db) {
        let orderId = generateOrderId();
        let isUnique = false;

        while (!isUnique) {
            const existing = await db.query('SELECT id FROM orders WHERE id = $1', [orderId]);
            if (existing.rows.length === 0) {
                isUnique = true;
            } else {
                orderId = generateOrderId();
            }
        }

        const result = await db.query(
            `INSERT INTO orders (id, merchant_id, amount, currency, receipt, notes, status, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             RETURNING id, merchant_id, amount, currency, receipt, notes, status, created_at`,
            [orderId, merchantId, amount, currency || 'INR', receipt, notes ? JSON.stringify(notes) : null, 'created']
        );

        return result.rows[0];
    }

    static async getOrder(orderId, db) {
        const result = await db.query(
            'SELECT * FROM orders WHERE id = $1',
            [orderId]
        );

        return result.rows[0] || null;
    }
}

module.exports = OrderService;
