import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8000';

function Checkout() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentId, setPaymentId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // UPI form
  const [vpa, setVpa] = useState('');

  // Card form
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderIdParam = params.get('order_id');
    if (orderIdParam) {
      setOrderId(orderIdParam);
      fetchOrder(orderIdParam);
    }
  }, []);

  const fetchOrder = async (orderId) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/orders/${orderId}/public`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      } else {
        setErrorMessage('Order not found');
      }
    } catch (error) {
      setErrorMessage('Failed to fetch order');
    }
  };

  const showUPIForm = () => {
    setSelectedMethod('upi');
    setErrorMessage('');
  };

  const showCardForm = () => {
    setSelectedMethod('card');
    setErrorMessage('');
  };

  const handleUPISubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${API_URL}/api/v1/payments/public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          method: 'upi',
          vpa: vpa,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setPaymentId(data.id);
        pollPaymentStatus(data.id);
      } else {
        setProcessing(false);
        setErrorMessage(data.error?.description || 'Payment failed');
      }
    } catch (error) {
      setProcessing(false);
      setErrorMessage('Payment request failed');
    }
  };

  const handleCardSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setErrorMessage('');

    // Parse expiry MM/YY
    const [expiryMonth, expiryYear] = expiry.split('/').map(s => s.trim());

    try {
      const response = await fetch(`${API_URL}/api/v1/payments/public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          method: 'card',
          card: {
            number: cardNumber,
            expiry_month: expiryMonth,
            expiry_year: expiryYear,
            cvv: cvv,
            holder_name: cardholderName,
          },
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setPaymentId(data.id);
        pollPaymentStatus(data.id);
      } else {
        setProcessing(false);
        setErrorMessage(data.error?.description || 'Payment failed');
      }
    } catch (error) {
      setProcessing(false);
      setErrorMessage('Payment request failed');
    }
  };

  const pollPaymentStatus = (paymentId) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/payments/${paymentId}/public`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success' || data.status === 'failed') {
            clearInterval(interval);
            setPaymentStatus(data.status);
            setProcessing(false);
            if (data.status === 'failed') {
              setErrorMessage(data.error_description || 'Payment could not be processed');
            }
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000);

    // Stop polling after 30 seconds
    setTimeout(() => {
      clearInterval(interval);
      if (paymentStatus !== 'success' && paymentStatus !== 'failed') {
        setProcessing(false);
        setErrorMessage('Payment timeout - please check status later');
      }
    }, 30000);
  };

  const handleRetry = () => {
    setPaymentStatus('');
    setPaymentId('');
    setErrorMessage('');
    setVpa('');
    setCardNumber('');
    setExpiry('');
    setCvv('');
    setCardholderName('');
    setSelectedMethod('');
  };

  if (!order) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p>Loading order...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (paymentStatus === 'success') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div data-test-id="success-state">
            <h2 style={styles.successTitle}>Payment Successful!</h2>
            <div style={styles.infoRow}>
              <span>Payment ID: </span>
              <span data-test-id="payment-id">{paymentId}</span>
            </div>
            <span data-test-id="success-message" style={styles.message}>
              Your payment has been processed successfully
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (paymentStatus === 'failed') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div data-test-id="error-state">
            <h2 style={styles.errorTitle}>Payment Failed</h2>
            <span data-test-id="error-message" style={styles.errorText}>
              {errorMessage}
            </span>
            <button 
              data-test-id="retry-button" 
              onClick={handleRetry}
              style={styles.retryButton}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Processing state
  if (processing) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div data-test-id="processing-state">
            <div style={styles.spinner}></div>
            <span data-test-id="processing-message" style={styles.message}>
              Processing payment...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Main checkout UI
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div data-test-id="checkout-container">
          {/* Order Summary */}
          <div data-test-id="order-summary" style={styles.section}>
            <h2 style={styles.title}>Complete Payment</h2>
            <div style={styles.infoRow}>
              <span>Amount: </span>
              <span data-test-id="order-amount" style={styles.amount}>
                ₹{(order.amount / 100).toFixed(2)}
              </span>
            </div>
            <div style={styles.infoRow}>
              <span>Order ID: </span>
              <span data-test-id="order-id" style={styles.orderId}>{order.id}</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          {!selectedMethod && (
            <div data-test-id="payment-methods" style={styles.section}>
              <h3 style={styles.subtitle}>Select Payment Method</h3>
              <div style={styles.methodButtons}>
                <button
                  data-test-id="method-upi"
                  data-method="upi"
                  onClick={showUPIForm}
                  style={styles.methodButton}
                >
                  UPI
                </button>
                <button
                  data-test-id="method-card"
                  data-method="card"
                  onClick={showCardForm}
                  style={styles.methodButton}
                >
                  Card
                </button>
              </div>
            </div>
          )}

          {/* UPI Payment Form */}
          {selectedMethod === 'upi' && (
            <form 
              data-test-id="upi-form" 
              onSubmit={handleUPISubmit}
              style={styles.form}
            >
              <h3 style={styles.subtitle}>UPI Payment</h3>
              <input
                data-test-id="vpa-input"
                placeholder="username@bank"
                type="text"
                value={vpa}
                onChange={(e) => setVpa(e.target.value)}
                style={styles.input}
                required
              />
              <button 
                data-test-id="pay-button" 
                type="submit"
                style={styles.payButton}
              >
                Pay ₹{(order.amount / 100).toFixed(2)}
              </button>
              <button 
                type="button" 
                onClick={() => setSelectedMethod('')}
                style={styles.backButton}
              >
                Back
              </button>
            </form>
          )}

          {/* Card Payment Form */}
          {selectedMethod === 'card' && (
            <form 
              data-test-id="card-form" 
              onSubmit={handleCardSubmit}
              style={styles.form}
            >
              <h3 style={styles.subtitle}>Card Payment</h3>
              <input
                data-test-id="card-number-input"
                placeholder="Card Number"
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                style={styles.input}
                required
              />
              <input
                data-test-id="expiry-input"
                placeholder="MM/YY"
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                style={styles.input}
                required
              />
              <input
                data-test-id="cvv-input"
                placeholder="CVV"
                type="text"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                style={styles.input}
                maxLength="4"
                required
              />
              <input
                data-test-id="cardholder-name-input"
                placeholder="Name on Card"
                type="text"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                style={styles.input}
                required
              />
              <button 
                data-test-id="pay-button" 
                type="submit"
                style={styles.payButton}
              >
                Pay ₹{(order.amount / 100).toFixed(2)}
              </button>
              <button 
                type="button" 
                onClick={() => setSelectedMethod('')}
                style={styles.backButton}
              >
                Back
              </button>
            </form>
          )}

          {/* Error message */}
          {errorMessage && !paymentStatus && (
            <div style={styles.error}>{errorMessage}</div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  section: {
    marginBottom: '30px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#333',
  },
  subtitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '15px',
    color: '#555',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontSize: '16px',
    color: '#666',
  },
  amount: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#667eea',
  },
  orderId: {
    fontSize: '14px',
    color: '#999',
    fontFamily: 'monospace',
  },
  methodButtons: {
    display: 'flex',
    gap: '15px',
  },
  methodButton: {
    flex: 1,
    padding: '15px',
    fontSize: '16px',
    fontWeight: '600',
    border: '2px solid #667eea',
    background: 'white',
    color: '#667eea',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  form: {
    marginTop: '20px',
  },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '15px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '16px',
    boxSizing: 'border-box',
    transition: 'border-color 0.3s',
  },
  payButton: {
    width: '100%',
    padding: '15px',
    fontSize: '18px',
    fontWeight: '600',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.3s',
    marginBottom: '10px',
  },
  backButton: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    background: 'transparent',
    color: '#667eea',
    border: '2px solid #667eea',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #f3f3f3',
    borderTop: '5px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '20px auto',
  },
  message: {
    display: 'block',
    textAlign: 'center',
    fontSize: '18px',
    color: '#666',
    marginTop: '15px',
  },
  successTitle: {
    color: '#10b981',
    fontSize: '28px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: '28px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  errorText: {
    color: '#ef4444',
    display: 'block',
    textAlign: 'center',
    marginBottom: '20px',
  },
  retryButton: {
    width: '100%',
    padding: '15px',
    fontSize: '18px',
    fontWeight: '600',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  error: {
    background: '#fee2e2',
    color: '#ef4444',
    padding: '12px',
    borderRadius: '8px',
    marginTop: '15px',
    textAlign: 'center',
  },
};

// Add spinner animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default Checkout;
