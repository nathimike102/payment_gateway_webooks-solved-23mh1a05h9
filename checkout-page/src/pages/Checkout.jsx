import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import './Checkout.css';

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
      <div className="checkout-page-container">
        <div className="checkout-page-card">
          <p>Loading order...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (paymentStatus === 'success') {
    return (
      <div className="checkout-page-container">
        <div className="checkout-page-card">
          <div data-test-id="success-state">
            <h2 className="checkout-page-success-title">Payment Successful!</h2>
            <div className="checkout-page-info-row">
              <span>Payment ID: </span>
              <span data-test-id="payment-id">{paymentId}</span>
            </div>
            <span data-test-id="success-message" className="checkout-page-message">
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
      <div className="checkout-page-container">
        <div className="checkout-page-card">
          <div data-test-id="error-state">
            <h2 className="checkout-page-error-title">Payment Failed</h2>
            <span data-test-id="error-message" className="checkout-page-error-text">
              {errorMessage}
            </span>
            <button 
              data-test-id="retry-button" 
              onClick={handleRetry}
              className="checkout-page-retry-button"
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
      <div className="checkout-page-container">
        <div className="checkout-page-card">
          <div data-test-id="processing-state">
            <div className="checkout-page-spinner"></div>
            <span data-test-id="processing-message" className="checkout-page-message">
              Processing payment...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Main checkout UI
  return (
    <div className="checkout-page-container">
      <div className="checkout-page-card">
        <div data-test-id="checkout-container">
          {/* Order Summary */}
          <div data-test-id="order-summary" className="checkout-page-section">
            <h2 className="checkout-page-title">Complete Payment</h2>
            <div className="checkout-page-info-row">
              <span>Amount: </span>
              <span data-test-id="order-amount" className="checkout-page-amount">
                ₹{(order.amount / 100).toFixed(2)}
              </span>
            </div>
            <div className="checkout-page-info-row">
              <span>Order ID: </span>
              <span data-test-id="order-id" className="checkout-page-order-id">{order.id}</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          {!selectedMethod && (
            <div data-test-id="payment-methods" className="checkout-page-section">
              <h3 className="checkout-page-subtitle">Select Payment Method</h3>
              <div className="checkout-page-method-buttons">
                <button
                  data-test-id="method-upi"
                  data-method="upi"
                  onClick={showUPIForm}
                  className="checkout-page-method-button"
                >
                  UPI
                </button>
                <button
                  data-test-id="method-card"
                  data-method="card"
                  onClick={showCardForm}
                  className="checkout-page-method-button"
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
              className="checkout-page-form"
            >
              <h3 className="checkout-page-subtitle">UPI Payment</h3>
              <input
                data-test-id="vpa-input"
                placeholder="username@bank"
                type="text"
                value={vpa}
                onChange={(e) => setVpa(e.target.value)}
                className="checkout-page-input"
                required
              />
              <button 
                data-test-id="pay-button" 
                type="submit"
                className="checkout-page-pay-button"
              >
                Pay ₹{(order.amount / 100).toFixed(2)}
              </button>
              <button 
                type="button" 
                onClick={() => setSelectedMethod('')}
                className="checkout-page-back-button"
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
              className="checkout-page-form"
            >
              <h3 className="checkout-page-subtitle">Card Payment</h3>
              <input
                data-test-id="card-number-input"
                placeholder="Card Number"
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="checkout-page-input"
                required
              />
              <input
                data-test-id="expiry-input"
                placeholder="MM/YY"
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="checkout-page-input"
                required
              />
              <input
                data-test-id="cvv-input"
                placeholder="CVV"
                type="text"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                className="checkout-page-input"
                maxLength="4"
                required
              />
              <input
                data-test-id="cardholder-name-input"
                placeholder="Name on Card"
                type="text"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                className="checkout-page-input"
                required
              />
              <button 
                data-test-id="pay-button" 
                type="submit"
                className="checkout-page-pay-button"
              >
                Pay ₹{(order.amount / 100).toFixed(2)}
              </button>
              <button 
                type="button" 
                onClick={() => setSelectedMethod('')}
                className="checkout-page-back-button"
              >
                Back
              </button>
            </form>
          )}

          {/* Error message */}
          {errorMessage && !paymentStatus && (
            <div className="checkout-page-error">{errorMessage}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Checkout;
