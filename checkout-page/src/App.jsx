import { useState, useEffect } from 'react'
import { API_URL } from './config'
import './App.css'

function App() {
  const [order, setOrder] = useState(null)
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [paymentState, setPaymentState] = useState('form') // form, processing, success, error
  const [paymentId, setPaymentId] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [orderLoading, setOrderLoading] = useState(false)
  const [showOrderForm, setShowOrderForm] = useState(false)

  // Order form
  const [orderAmount, setOrderAmount] = useState('')

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
    } else {
      setShowOrderForm(true)
    }
  }, [])

  const fetchOrder = async (orderId) => {
    try {
      setOrderLoading(true)
      const response = await fetch(`${API_URL}/api/v1/orders/${orderId}/public`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data)
      } else {
        setErrorMessage('Order not found')
        setShowOrderForm(true)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      setShowOrderForm(true)
    } finally {
      setOrderLoading(false)
    }
  }

  const handleCreateOrder = async (e) => {
    e.preventDefault()
    if (!orderAmount || orderAmount < 1) {
      setErrorMessage('Amount must be at least ₹1.00')
      return
    }

    try {
      setOrderLoading(true)
      setErrorMessage('')
      
      // Create a demo order in the database
      const amountInPaise = Math.round(parseFloat(orderAmount) * 100)
      
      // Use a public endpoint to create demo order (no auth required)
      const response = await fetch(`${API_URL}/api/v1/orders/create-demo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: 'INR'
        })
      })
      
      if (response.ok) {
        const order = await response.json()
        setOrder(order)
        setShowOrderForm(false)
        setOrderLoading(false)
      } else {
        const error = await response.json()
        setErrorMessage(error.description || 'Failed to create order')
        setOrderLoading(false)
      }
    } catch (error) {
      console.error('Error:', error)
      setErrorMessage('Failed to process request')
      setOrderLoading(false)
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

  if (showOrderForm && !order) {
    return (
      <div className="checkout-container">
        <div className="checkout-card">
          <h1 className="checkout-title">Payment Checkout</h1>
          <div className="checkout-order-form">
            <h2 className="checkout-subtitle">Enter Order Details</h2>
            <form onSubmit={handleCreateOrder}>
              <div className="checkout-form-group">
                <label className="checkout-label">Amount (in Rupees)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Enter amount (minimum ₹1.00)"
                  value={orderAmount}
                  onChange={(e) => setOrderAmount(e.target.value)}
                  required
                  disabled={orderLoading}
                  className="checkout-input"
                />
              </div>
              {errorMessage && <div className="checkout-error-box">{errorMessage}</div>}
              <button 
                type="submit" 
                disabled={orderLoading || !orderAmount}
                className="checkout-pay-button"
              >
                {orderLoading ? 'Processing...' : 'Proceed to Payment'}
              </button>
            </form>
            <div className="checkout-info-box">
              <p><strong>ℹ️ How it works:</strong></p>
              <p>You can test payments directly here, or create orders from the merchant dashboard and share the checkout link:</p>
              <code className="checkout-code">
                http://localhost:3001/checkout?order_id=YOUR_ORDER_ID
              </code>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="checkout-container">
        <div className="checkout-loading">Loading order details...</div>
      </div>
    )
  }

  return (
    <div className="checkout-container">
      <div data-test-id="checkout-container" className="checkout-card">
        {/* Order Summary */}
        <div data-test-id="order-summary" className="checkout-order-summary">
          <h2 className="checkout-title">Complete Payment</h2>
          <div className="checkout-summary-row">
            <span>Amount: </span>
            <span data-test-id="order-amount" className="checkout-amount">
              {formatAmount(order.amount)}
            </span>
          </div>
          <div className="checkout-summary-row">
            <span>Order ID: </span>
            <span data-test-id="order-id" className="checkout-order-id">{order.id}</span>
          </div>
        </div>

        {/* Payment Method Selection */}
        {paymentState === 'form' && !selectedMethod && (
          <div data-test-id="payment-methods" className="checkout-payment-methods">
            <h3 className="checkout-subtitle">Select Payment Method</h3>
            <div className="checkout-method-buttons">
              <button
                data-test-id="method-upi"
                data-method="upi"
                onClick={showUPIForm}
                className="checkout-method-button"
              >
                📱 UPI
              </button>
              <button
                data-test-id="method-card"
                data-method="card"
                onClick={showCardForm}
                className="checkout-method-button"
              >
                💳 Card
              </button>
            </div>
          </div>
        )}

        {/* UPI Payment Form */}
        {paymentState === 'form' && selectedMethod === 'upi' && (
          <form data-test-id="upi-form" onSubmit={handleUPISubmit} className="checkout-form">
            <h3 className="checkout-subtitle">UPI Payment</h3>
            <input
              data-test-id="vpa-input"
              type="text"
              placeholder="username@bank"
              value={vpa}
              onChange={(e) => setVpa(e.target.value)}
              required
              className="checkout-input"
            />
            <button data-test-id="pay-button" type="submit" className="checkout-pay-button">
              Pay {formatAmount(order.amount)}
            </button>
            <button type="button" onClick={() => setSelectedMethod(null)} className="checkout-back-button">
              ← Back
            </button>
          </form>
        )}

        {/* Card Payment Form */}
        {paymentState === 'form' && selectedMethod === 'card' && (
          <form data-test-id="card-form" onSubmit={handleCardSubmit} className="checkout-form">
            <h3 className="checkout-subtitle">Card Payment</h3>
            <input
              data-test-id="card-number-input"
              type="text"
              placeholder="Card Number"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              required
              className="checkout-input"
            />
            <div className="checkout-card-row">
              <input
                data-test-id="expiry-input"
                type="text"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                required
                className="checkout-input"
              />
              <input
                data-test-id="cvv-input"
                type="text"
                placeholder="CVV"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                required
                className="checkout-input"
              />
            </div>
            <input
              data-test-id="cardholder-name-input"
              type="text"
              placeholder="Name on Card"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              required
              className="checkout-input"
            />
            <button data-test-id="pay-button" type="submit" className="checkout-pay-button">
              Pay {formatAmount(order.amount)}
            </button>
            <button type="button" onClick={() => setSelectedMethod(null)} className="checkout-back-button">
              ← Back
            </button>
          </form>
        )}

        {/* Processing State */}
        {paymentState === 'processing' && (
          <div data-test-id="processing-state" className="checkout-processing-state">
            <div className="spinner"></div>
            <span data-test-id="processing-message" className="checkout-processing-message">
              Processing payment...
            </span>
          </div>
        )}

        {/* Success State */}
        {paymentState === 'success' && (
          <div data-test-id="success-state" className="checkout-success-state">
            <div className="checkout-success-icon">✓</div>
            <h2 className="checkout-success-title">Payment Successful!</h2>
            <div className="checkout-summary-row">
              <span>Payment ID: </span>
              <span data-test-id="payment-id" className="checkout-payment-id">{paymentId}</span>
            </div>
            <span data-test-id="success-message" className="checkout-success-message">
              Your payment has been processed successfully
            </span>
          </div>
        )}

        {/* Error State */}
        {paymentState === 'error' && (
          <div data-test-id="error-state" className="checkout-error-state">
            <div className="checkout-error-icon">✕</div>
            <h2 className="checkout-error-title">Payment Failed</h2>
            <span data-test-id="error-message" className="checkout-error-message">
              {errorMessage}
            </span>
            <button data-test-id="retry-button" onClick={handleRetry} className="checkout-retry-button">
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
