import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { API_URL } from '../config'
import './Checkout.css'

function Checkout() {
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [state, setState] = useState('form') // form, processing, success, error
  const [errorMessage, setErrorMessage] = useState('')
  const [orderLoading, setOrderLoading] = useState(false)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [orderAmount, setOrderAmount] = useState('')
  const [vpa, setVpa] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardholderName, setCardholderName] = useState('')
  const [paymentId, setPaymentId] = useState(null)
  const [step, setStep] = useState('amount') // amount, method, payment

  const apiKey = localStorage.getItem('apiKey')
  const apiSecret = localStorage.getItem('apiSecret')

  useEffect(() => {
    if (!apiKey || !apiSecret) {
      navigate('/login')
      return
    }

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
      const response = await fetch(`${API_URL}/api/v1/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'X-Api-Key': apiKey,
          'X-Api-Secret': apiSecret,
        },
      })
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
      const amountInPaise = Math.round(parseFloat(orderAmount) * 100)
      const response = await fetch(`${API_URL}/api/v1/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
          'X-Api-Secret': apiSecret,
        },
        body: JSON.stringify({ amount: amountInPaise, currency: 'INR' })
      })
      if (response.ok) {
        const newOrder = await response.json()
        setOrder(newOrder)
        setShowOrderForm(false)
      } else {
        const error = await response.json()
        setErrorMessage(error.description || 'Failed to create order')
      }
    } catch (error) {
      console.error('Error:', error)
      setErrorMessage('Failed to process request')
    } finally {
      setOrderLoading(false)
    }
  }

  const handleUPISubmit = async (e) => {
    e.preventDefault()
    setState('processing')
    try {
      const response = await fetch(`${API_URL}/api/v1/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
          'X-Api-Secret': apiSecret,
        },
        body: JSON.stringify({ order_id: order.id, method: 'upi', vpa })
      })
      const data = await response.json()
      if (response.ok) {
        setPaymentId(data.id)
        pollPaymentStatus(data.id)
      } else {
        setState('error')
        setErrorMessage(data.error?.description || 'Payment failed')
      }
    } catch (error) {
      setState('error')
      setErrorMessage('Payment failed')
    }
  }

  const handleCardSubmit = async (e) => {
    e.preventDefault()
    setState('processing')
    const [month, year] = expiry.split('/')
    try {
      const response = await fetch(`${API_URL}/api/v1/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
          'X-Api-Secret': apiSecret,
        },
        body: JSON.stringify({
          order_id: order.id,
          method: 'card',
          card: { number: cardNumber, expiry_month: month, expiry_year: year, cvv, holder_name: cardholderName }
        })
      })
      const data = await response.json()
      if (response.ok) {
        setPaymentId(data.id)
        pollPaymentStatus(data.id)
      } else {
        setState('error')
        setErrorMessage(data.error?.description || 'Payment failed')
      }
    } catch (error) {
      setState('error')
      setErrorMessage('Payment failed')
    }
  }

  const pollPaymentStatus = async (paymentId) => {
    const maxAttempts = 30
    let attempts = 0
    const poll = setInterval(async () => {
      attempts++
      try {
        const response = await fetch(`${API_URL}/api/v1/payments/${paymentId}`, {
          method: 'GET',
          headers: {
            'X-Api-Key': apiKey,
            'X-Api-Secret': apiSecret,
          },
        })
        const data = await response.json()
        if (data.status === 'success') {
          clearInterval(poll)
          setState('success')
        } else if (data.status === 'failed') {
          clearInterval(poll)
          setState('error')
          setErrorMessage(data.error_description || 'Payment failed')
        }
        if (attempts >= maxAttempts) {
          clearInterval(poll)
          setState('error')
          setErrorMessage('Payment timeout')
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 2000)
  }

  const handleRetry = () => {
    setState('form')
    setSelectedMethod(null)
    setVpa('')
    setCardNumber('')
    setExpiry('')
    setCvv('')
    setCardholderName('')
    setErrorMessage('')
    setStep('method')
  }

  const handleBackToAmount = () => {
    setSelectedMethod(null)
    setState('form')
    setErrorMessage('')
  }

  const formatAmount = (amount) => `₹${(amount / 100).toFixed(2)}`

  if (!order && !showOrderForm) {
    return (
      <div className="checkout-container">
        <nav className="checkout-nav">
          <h1 className="checkout-title">Payment Gateway Dashboard</h1>
          <Link to="/dashboard" className="checkout-back">
            <button className="back-button">← Back to Dashboard</button>
          </Link>
        </nav>
        <div className="checkout-content">
          <div className="checkout-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text)' }}>
            Loading order details...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-container">
      <nav className="checkout-nav">
        <h1 className="checkout-title">Payment Gateway Dashboard</h1>
        <Link to="/dashboard" className="checkout-back">
          <button className="back-button">← Back to Dashboard</button>
        </Link>
      </nav>

      <div className="checkout-content">
        <div className="checkout-card">
          {showOrderForm && !order ? (
            <>
              <h2 className="checkout-heading">Enter Amount</h2>
              <form onSubmit={handleCreateOrder} className="checkout-form">
                <div className="checkout-form-group">
                  <label className="checkout-label">Amount (in Rupees)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="Enter amount"
                    value={orderAmount}
                    onChange={(e) => setOrderAmount(e.target.value)}
                    required
                    disabled={orderLoading}
                    className="checkout-input"
                  />
                </div>
                {errorMessage && <div className="checkout-error">{errorMessage}</div>}
                <button
                  type="submit"
                  disabled={orderLoading || !orderAmount}
                  className="checkout-submit"
                >
                  {orderLoading ? 'Processing...' : 'Proceed to Payment'}
                </button>
              </form>
            </>
          ) : order ? (
            <>
              <h2 className="checkout-heading">Complete Payment</h2>
              <div className="checkout-summary">
                <div className="checkout-summary-row">
                  <span>Amount:</span>
                  <span className="checkout-amount">{formatAmount(order.amount)}</span>
                </div>
                <div className="checkout-summary-row">
                  <span>Order ID:</span>
                  <span className="checkout-order-id">{order.id}</span>
                </div>
              </div>

              {state === 'form' && !selectedMethod && (
                <div className="checkout-methods">
                  <button onClick={() => { setSelectedMethod('upi'); setStep('payment') }} className="checkout-method-btn">
                    💳 Pay with UPI
                  </button>
                  <button onClick={() => { setSelectedMethod('card'); setStep('payment') }} className="checkout-method-btn">
                    🏦 Pay with Card
  background: transparent;
                  </button>
                  <button onClick={() => { setOrder(null); setOrderAmount(''); setErrorMessage('') }} className="checkout-back-btn">
                    ← Change Amount
                  </button>
                </div>
              )}

              {state === 'form' && selectedMethod === 'upi' && (
                <form onSubmit={handleUPISubmit} className="checkout-form">
                  <div className="checkout-form-group">
                    <label className="checkout-label">UPI ID (e.g., user@upi)</label>
                    <input
                      type="text"
                      placeholder="user@upi"
                      value={vpa}
                      onChange={(e) => setVpa(e.target.value)}
                      required
                      className="checkout-input"
                    />
                  </div>
                  {errorMessage && <div className="checkout-error">{errorMessage}</div>}
                  <button type="submit" className="checkout-pay">Pay {formatAmount(order.amount)}</button>
                  <button type="button" onClick={handleBackToAmount} className="checkout-back-btn">← Back to Methods</button>
                </form>
              )}

              {state === 'form' && selectedMethod === 'card' && (
                <form onSubmit={handleCardSubmit} className="checkout-form">
                  <div className="checkout-form-group">
                    <label className="checkout-label">Card Number</label>
                    <input type="text" placeholder="4242 4242 4242 4242" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} required className="checkout-input" />
                  </div>
                  <div className="checkout-row">
                    <div className="checkout-form-group">
                      <label className="checkout-label">Expiry (MM/YY)</label>
                      <input type="text" placeholder="12/25" value={expiry} onChange={(e) => setExpiry(e.target.value)} required className="checkout-input" />
                    </div>
                    <div className="checkout-form-group">
                      <label className="checkout-label">CVV</label>
                      <input type="text" placeholder="123" value={cvv} onChange={(e) => setCvv(e.target.value)} required className="checkout-input" />
                    </div>
                  </div>
                  <div className="checkout-form-group">
                    <label className="checkout-label">Cardholder Name</label>
                    <input type="text" placeholder="John Doe" value={cardholderName} onChange={(e) => setCardholderName(e.target.value)} required className="checkout-input" />
                  </div>
                  {errorMessage && <div className="checkout-error">{errorMessage}</div>}
                  <button type="submit" className="checkout-pay">Pay {formatAmount(order.amount)}</button>
                  <button type="button" onClick={handleBackToAmount} className="checkout-back-btn">← Back to Methods</button>
                </form>
              )}

              {state === 'processing' && (
                <div className="checkout-processing">
                  <div className="checkout-spinner"></div>
                  <div className="checkout-processing-text">Processing payment...</div>
                </div>
              )}

              {state === 'success' && (
                <div className="checkout-success">
                  <div className="checkout-success-icon">✅</div>
                  <div className="checkout-success-title">Payment Successful!</div>
                  <div className="checkout-success-text">Your payment has been processed successfully.</div>
                  <div className="checkout-payment-id">{paymentId}</div>
                  <Link to="/dashboard" style={{ width: '100%', display: 'block' }}>
                    <button className="checkout-submit" style={{ marginTop: '16px', width: '100%' }}>Return to Dashboard</button>
                  </Link>
                </div>
              )}

              {state === 'error' && (
                <div className="checkout-error-state">
                  <div className="checkout-error-icon">❌</div>
                  <div className="checkout-error-title">Payment Failed</div>
                  <div className="checkout-error-text">{errorMessage}</div>
                  <button onClick={handleRetry} className="checkout-submit">Try Again</button>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default Checkout
