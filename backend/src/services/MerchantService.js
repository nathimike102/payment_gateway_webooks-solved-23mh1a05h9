class MerchantService {
    static async validateCredentials(apiKey, apiSecret, db) {
        const result = await db.query(
            'SELECT id, name, email FROM merchants WHERE api_key = $1 AND api_secret = $2 AND is_active = true',
            [apiKey, apiSecret]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0];
    }

    static async getMerchantById(merchantId, db) {
        const result = await db.query(
            'SELECT * FROM merchants WHERE id = $1',
            [merchantId]
        );

        return result.rows[0] || null;
    }
}

module.exports = MerchantService;
