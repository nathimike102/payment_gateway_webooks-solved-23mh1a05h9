import { useState, useEffect } from 'react'

const API_URL = 'http://localhost:8000'

function App() {
  const [order, setOrder] = useState(null)
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [paymentState, setPaymentState] = useState('form') // form, processing, success, error
  const [paymentId, setPaymentId] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  // UPI form
  const [vpa, setVpa] = useState('')

  // Card form
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardholderName, setCardholderName] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const orderId = params.get('order_id')

    if (orderId) {
      fetchOrder(orderId)
    }
  }, [])

  const fetchOrder = async (orderId) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/orders/${orderId}/public`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    }
  }

  const showUPIForm = () => {
    setSelectedMethod('upi')
  }

  const showCardForm = () => {
    setSelectedMethod('card')
  }

  const handleUPISubmit = async (e) => {
    e.preventDefault()
    setPaymentState('processing')

    try {
      const response = await fetch(`${API_URL}/api/v1/payments/public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: order.id,
          method: 'upi',
          vpa: vpa,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setPaymentId(data.id)
        // Start polling for payment status
        pollPaymentStatus(data.id)
      } else {
        setPaymentState('error')
        setErrorMessage(data.error?.description || 'Payment could not be processed')
      }
    } catch (error) {
      setPaymentState('error')
      setErrorMessage('Payment could not be processed')
    }
  }

  const handleCardSubmit = async (e) => {
    e.preventDefault()
    setPaymentState('processing')

    // Parse expiry (MM/YY format)
    const [month, year] = expiry.split('/')

    try {
      const response = await fetch(`${API_URL}/api/v1/payments/public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: order.id,
          method: 'card',
          card: {
            number: cardNumber,
            expiry_month: month,
            expiry_year: year,
            cvv: cvv,
            holder_name: cardholderName,
          },
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setPaymentId(data.id)
        // Start polling for payment status
        pollPaymentStatus(data.id)
      } else {
        setPaymentState('error')
        setErrorMessage(data.error?.description || 'Payment could not be processed')
      }
    } catch (error) {
      setPaymentState('error')
      setErrorMessage('Payment could not be processed')
    }
  }

  const pollPaymentStatus = async (paymentId) => {
    const maxAttempts = 30
    let attempts = 0

    const poll = setInterval(async () => {
      attempts++

      try {
        const response = await fetch(`${API_URL}/api/v1/payments/${paymentId}/public`)
        const data = await response.json()

        if (data.status === 'success') {
          clearInterval(poll)
          setPaymentState('success')
        } else if (data.status === 'failed') {
          clearInterval(poll)
          setPaymentState('error')
          setErrorMessage(data.error_description || 'Payment could not be processed')
        }

        if (attempts >= maxAttempts) {
          clearInterval(poll)
          setPaymentState('error')
          setErrorMessage('Payment timeout. Please try again.')
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 2000)
  }

  const handleRetry = () => {
    setPaymentState('form')
    setSelectedMethod(null)
    setVpa('')
    setCardNumber('')
    setExpiry('')
    setCvv('')
    setCardholderName('')
    setErrorMessage('')
  }

  const formatAmount = (amount) => {
    return `₹${(amount / 100).toFixed(2)}`
  }

  if (!order) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading order details...</div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div data-test-id="checkout-container" style={styles.checkoutContainer}>
        {/* Order Summary */}
        <div data-test-id="order-summary" style={styles.orderSummary}>
          <h2 style={styles.title}>Complete Payment</h2>
          <div style={styles.summaryRow}>
            <span>Amount: </span>
            <span data-test-id="order-amount" style={styles.amount}>
              {formatAmount(order.amount)}
            </span>
          </div>
          <div style={styles.summaryRow}>
            <span>Order ID: </span>
            <span data-test-id="order-id" style={styles.orderId}>{order.id}</span>
          </div>
        </div>

        {/* Payment Method Selection */}
        {paymentState === 'form' && !selectedMethod && (
          <div data-test-id="payment-methods" style={styles.paymentMethods}>
            <h3 style={styles.subtitle}>Select Payment Method</h3>
            <div style={styles.methodButtons}>
              <button
                data-test-id="method-upi"
                data-method="upi"
                onClick={showUPIForm}
                style={styles.methodButton}
              >
                📱 UPI
              </button>
              <button
                data-test-id="method-card"
                data-method="card"
                onClick={showCardForm}
                style={styles.methodButton}
              >
                💳 Card
              </button>
            </div>
          </div>
        )}

        {/* UPI Payment Form */}
        {paymentState === 'form' && selectedMethod === 'upi' && (
          <form data-test-id="upi-form" onSubmit={handleUPISubmit} style={styles.form}>
            <h3 style={styles.subtitle}>UPI Payment</h3>
            <input
              data-test-id="vpa-input"
              type="text"
              placeholder="username@bank"
              value={vpa}
              onChange={(e) => setVpa(e.target.value)}
              required
              style={styles.input}
            />
            <button data-test-id="pay-button" type="submit" style={styles.payButton}>
              Pay {formatAmount(order.amount)}
            </button>
            <button type="button" onClick={() => setSelectedMethod(null)} style={styles.backButton}>
              ← Back
            </button>
          </form>
        )}

        {/* Card Payment Form */}
        {paymentState === 'form' && selectedMethod === 'card' && (
          <form data-test-id="card-form" onSubmit={handleCardSubmit} style={styles.form}>
            <h3 style={styles.subtitle}>Card Payment</h3>
            <input
              data-test-id="card-number-input"
              type="text"
              placeholder="Card Number"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              required
              style={styles.input}
            />
            <div style={styles.cardRow}>
              <input
                data-test-id="expiry-input"
                type="text"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                required
                style={{ ...styles.input, width: '48%' }}
              />
              <input
                data-test-id="cvv-input"
                type="text"
                placeholder="CVV"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                required
                style={{ ...styles.input, width: '48%' }}
              />
            </div>
            <input
              data-test-id="cardholder-name-input"
              type="text"
              placeholder="Name on Card"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              required
              style={styles.input}
            />
            <button data-test-id="pay-button" type="submit" style={styles.payButton}>
              Pay {formatAmount(order.amount)}
            </button>
            <button type="button" onClick={() => setSelectedMethod(null)} style={styles.backButton}>
              ← Back
            </button>
          </form>
        )}

        {/* Processing State */}
        {paymentState === 'processing' && (
          <div data-test-id="processing-state" style={styles.processingState}>
            <div className="spinner"></div>
            <span data-test-id="processing-message" style={styles.processingMessage}>
              Processing payment...
            </span>
          </div>
        )}

        {/* Success State */}
        {paymentState === 'success' && (
          <div data-test-id="success-state" style={styles.successState}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.successTitle}>Payment Successful!</h2>
            <div style={styles.summaryRow}>
              <span>Payment ID: </span>
              <span data-test-id="payment-id" style={styles.paymentId}>{paymentId}</span>
            </div>
            <span data-test-id="success-message" style={styles.successMessage}>
              Your payment has been processed successfully
            </span>
          </div>
        )}

        {/* Error State */}
        {paymentState === 'error' && (
          <div data-test-id="error-state" style={styles.errorState}>
            <div style={styles.errorIcon}>✕</div>
            <h2 style={styles.errorTitle}>Payment Failed</h2>
            <span data-test-id="error-message" style={styles.errorMessage}>
              {errorMessage}
            </span>
            <button data-test-id="retry-button" onClick={handleRetry} style={styles.retryButton}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0056b3',
    padding: '20px',
  },
  loading: {
    color: 'white',
    fontSize: '18px',
  },
  checkoutContainer: {
    background: 'white',
    borderRadius: '15px',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  orderSummary: {
    marginBottom: '30px',
    padding: '20px',
    background: '#f7fafc',
    borderRadius: '10px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#333',
  },
  subtitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#555',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontSize: '16px',
    color: '#666',
  },
  amount: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#ff8c00',
  },
  orderId: {
    fontFamily: 'monospace',
    fontSize: '14px',
    color: '#ff8c00',
  },
  paymentMethods: {
    marginBottom: '20px',
  },
  methodButtons: {
    display: 'flex',
    gap: '15px',
  },
  methodButton: {
    flex: 1,
    padding: '20px',
    fontSize: '18px',
    fontWeight: 'bold',
    background: '#0056b3',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  input: {
    padding: '12px 15px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    outline: 'none',
  },
  cardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '15px',
  },
  payButton: {
    padding: '15px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'white',
    background: '#ff8c00',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '10px',
  },
  backButton: {
    padding: '12px',
    fontSize: '14px',
    color: '#ff8c00',
    background: 'transparent',
    border: '1px solid #ff8c00',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  processingState: {
    textAlign: 'center',
    padding: '40px 20px',
    background: '#0056b3',
    borderRadius: '10px',
    color: 'white',
  },
  processingMessage: {
    fontSize: '18px',
    fontWeight: '600',
  },
  successState: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  successIcon: {
    fontSize: '64px',
    color: '#48bb78',
    marginBottom: '20px',
  },
  successTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '20px',
  },
  successMessage: {
    fontSize: '16px',
    color: '#666',
    display: 'block',
    marginTop: '10px',
  },
  paymentId: {
    fontFamily: 'monospace',
    fontSize: '14px',
    color: '#ff8c00',
  },
  errorState: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  errorIcon: {
    fontSize: '64px',
    color: '#f56565',
    marginBottom: '20px',
  },
  errorTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '20px',
  },
  errorMessage: {
    fontSize: '16px',
    color: '#666',
    display: 'block',
    marginBottom: '30px',
  },
  retryButton: {
    padding: '12px 30px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    background: '#ff8c00',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
}

export default App
