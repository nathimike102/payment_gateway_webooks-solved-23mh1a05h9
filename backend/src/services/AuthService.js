const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../db');

class AuthService {
    // Hash password for storage
    async hashPassword(password) {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }

    // Verify password during login
    async verifyPassword(password, hash) {
        return bcrypt.compare(password, hash);
    }

    // Generate random API key and secret
    generateApiCredentials() {
        const apiKey = 'key_' + crypto.randomBytes(16).toString('hex');
        const apiSecret = 'secret_' + crypto.randomBytes(24).toString('hex');
        return { apiKey, apiSecret };
    }

    // Register new merchant
    async register(name, email, password) {
        try {
            // Check if email already exists
            const existingMerchant = await db.query(
                'SELECT id FROM merchants WHERE email = $1',
                [email.toLowerCase()]
            );

            if (existingMerchant.rows.length > 0) {
                throw new Error('Email already registered');
            }

            // Hash password
            const passwordHash = await this.hashPassword(password);

            // Generate API credentials
            const { apiKey, apiSecret } = this.generateApiCredentials();

            // Insert merchant
            const result = await db.query(
                'INSERT INTO merchants (name, email, password_hash, api_key, api_secret) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, api_key, api_secret',
                [name, email.toLowerCase(), passwordHash, apiKey, apiSecret]
            );

            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Authenticate merchant
    async authenticate(email, password) {
        try {
            const result = await db.query(
                'SELECT id, name, email, password_hash, api_key, api_secret FROM merchants WHERE email = $1 AND is_active = true',
                [email.toLowerCase()]
            );

            if (result.rows.length === 0) {
                throw new Error('Invalid email or password');
            }

            const merchant = result.rows[0];

            // Verify password
            const isValidPassword = await this.verifyPassword(password, merchant.password_hash);

            if (!isValidPassword) {
                throw new Error('Invalid email or password');
            }

            // Return merchant without password
            const { password_hash, ...merchantData } = merchant;
            return merchantData;
        } catch (error) {
            throw error;
        }
    }

    // Get merchant by ID
    async getMerchantById(merchantId) {
        try {
            const result = await db.query(
                'SELECT id, name, email, api_key, api_secret FROM merchants WHERE id = $1 AND is_active = true',
                [merchantId]
            );

            if (result.rows.length === 0) {
                throw new Error('Merchant not found');
            }

            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new AuthService();
