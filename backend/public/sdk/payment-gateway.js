/**
 * Payment Gateway SDK
 * Embeddable JavaScript library for merchant integrations
 * 
 * Usage:
 * <script src="https://api.paymentgateway.com/sdk/payment-gateway.js"></script>
 * 
 * const gateway = new PaymentGateway({
 *   apiKey: 'your_api_key',
 *   apiSecret: 'your_api_secret',
 *   baseUrl: 'https://api.paymentgateway.com'
 * });
 */

class PaymentGateway {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.baseUrl = config.baseUrl || 'http://localhost:8000';
    this.timeout = config.timeout || 30000;
  }

  /**
   * Create an order
   * @param {Object} order - Order details
   * @returns {Promise<Object>} Order response
   */
  async createOrder(order) {
    const endpoint = '/api/v1/orders';
    const body = {
      amount: order.amount,
      currency: order.currency || 'INR',
      receipt: order.receipt,
      notes: order.notes
    };

    return this._request('POST', endpoint, body);
  }

  /**
   * Get all orders
   * @param {Object} options - Query options (limit, skip)
   * @returns {Promise<Object>} Orders list
   */
  async getOrders(options = {}) {
    const params = new URLSearchParams({
      limit: options.limit || 50,
      skip: options.skip || 0
    });

    return this._request('GET', `/api/v1/orders?${params}`);
  }

  /**
   * Get order by ID
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Order details
   */
  async getOrder(orderId) {
    return this._request('GET', `/api/v1/orders/${orderId}`);
  }

  /**
   * Create a payment
   * @param {Object} payment - Payment details
   * @returns {Promise<Object>} Payment response
   */
  async createPayment(payment) {
    const endpoint = '/api/v1/payments';
    const body = {
      order_id: payment.orderId,
      method: payment.method,
      vpa: payment.vpa,
      card: payment.card
    };

    return this._request('POST', endpoint, body);
  }

  /**
   * Get all payments
   * @param {Object} options - Query options (limit, skip)
   * @returns {Promise<Object>} Payments list
   */
  async getPayments(options = {}) {
    const params = new URLSearchParams({
      limit: options.limit || 50,
      skip: options.skip || 0
    });

    return this._request('GET', `/api/v1/payments?${params}`);
  }

  /**
   * Get payment by ID
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object>} Payment details
   */
  async getPayment(paymentId) {
    return this._request('GET', `/api/v1/payments/${paymentId}`);
  }

  /**
   * Create a refund
   * @param {Object} refund - Refund details
   * @returns {Promise<Object>} Refund response
   */
  async createRefund(refund) {
    const endpoint = '/api/v1/refunds';
    const body = {
      payment_id: refund.paymentId,
      amount: refund.amount,
      reason: refund.reason,
      idempotency_key: refund.idempotencyKey
    };

    return this._request('POST', endpoint, body);
  }

  /**
   * Get all refunds
   * @param {Object} options - Query options (limit, skip, payment_id)
   * @returns {Promise<Object>} Refunds list
   */
  async getRefunds(options = {}) {
    const params = new URLSearchParams({
      limit: options.limit || 50,
      skip: options.skip || 0
    });

    if (options.paymentId) {
      params.append('payment_id', options.paymentId);
    }

    return this._request('GET', `/api/v1/refunds?${params}`);
  }

  /**
   * Get refund by ID
   * @param {string} refundId - Refund ID
   * @returns {Promise<Object>} Refund details
   */
  async getRefund(refundId) {
    return this._request('GET', `/api/v1/refunds/${refundId}`);
  }

  /**
   * Get queue status
   * @returns {Promise<Object>} Queue statistics
   */
  async getQueueStatus() {
    return this._request('GET', '/api/v1/queue/status');
  }

  /**
   * Health check
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    return this._request('GET', '/health', null, false);
  }

  /**
   * Internal request handler
   * @private
   */
  async _request(method, endpoint, body = null, requiresAuth = true) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json'
    };

    if (requiresAuth) {
      headers['X-Api-Key'] = this.apiKey;
      headers['X-Api-Secret'] = this.apiSecret;
    }

    const options = {
      method,
      headers
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), this.timeout)
        )
      ]);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Payment Gateway SDK Error:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   * @static
   * @param {Object} payload - Webhook payload
   * @param {string} signature - X-Webhook-Signature header value
   * @param {string} apiSecret - API secret
   * @returns {boolean} Signature valid
   */
  static verifyWebhookSignature(payload, signature, apiSecret) {
    // This requires crypto module, typically done on the server side
    // For client-side verification, use the server-side verification instead
    console.warn('Client-side webhook verification not recommended. Verify on server side.');
    return false;
  }

  /**
   * Format amount in rupees
   * @static
   * @param {number} paise - Amount in paise
   * @returns {string} Formatted amount
   */
  static formatAmount(paise) {
    const rupees = paise / 100;
    return `₹${rupees.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  /**
   * Validate UPI VPA
   * @static
   * @param {string} vpa - VPA address
   * @returns {boolean} Valid VPA
   */
  static isValidVPA(vpa) {
    const vpaRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
    return vpaRegex.test(vpa);
  }

  /**
   * Validate card number (Luhn algorithm)
   * @static
   * @param {string} cardNumber - Card number
   * @returns {boolean} Valid card number
   */
  static isValidCardNumber(cardNumber) {
    const cleaned = cardNumber.replace(/\D/g, '');
    if (cleaned.length < 13 || cleaned.length > 19) return false;

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Detect card network
   * @static
   * @param {string} cardNumber - Card number
   * @returns {string} Card network (VISA, MASTERCARD, AMEX, etc.)
   */
  static detectCardNetwork(cardNumber) {
    const cleaned = cardNumber.replace(/\D/g, '');

    if (/^4[0-9]{12}(?:[0-9]{3})?$/.test(cleaned)) return 'VISA';
    if (/^5[1-5][0-9]{14}$/.test(cleaned)) return 'MASTERCARD';
    if (/^3[47][0-9]{13}$/.test(cleaned)) return 'AMEX';
    if (/^3(?:0[0-5]|[68][0-9])[0-9]{11}$/.test(cleaned)) return 'DINERS';
    if (/^6(?:011|5[0-9]{2})[0-9]{12}$/.test(cleaned)) return 'DISCOVER';

    return 'UNKNOWN';
  }
}

// Export for CommonJS and global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PaymentGateway;
} else if (typeof window !== 'undefined') {
  window.PaymentGateway = PaymentGateway;
}
