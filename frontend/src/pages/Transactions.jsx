import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

import { API_URL } from '../config'
import './Transactions.css'

function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [refunds, setRefunds] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingRefunds, setLoadingRefunds] = useState(true)
  const navigate = useNavigate()

  const apiKey = localStorage.getItem('apiKey')
  const apiSecret = localStorage.getItem('apiSecret')

  useEffect(() => {
    if (!apiKey || !apiSecret) {
      navigate('/login')
      return
    }

    fetchTransactions()
    fetchRefunds()
  }, [])

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/payments`, {
        method: 'GET',
        headers: {
          'X-Api-Key': apiKey,
          'X-Api-Secret': apiSecret,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch payments')
      }

      const data = await response.json()
      setTransactions(data.payments || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const fetchRefunds = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/refunds`, {
        method: 'GET',
        headers: {
          'X-Api-Key': apiKey,
          'X-Api-Secret': apiSecret,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch refunds')
      }

      const data = await response.json()
      setRefunds(data.refunds || [])
    } catch (error) {
      console.error('Error fetching refunds:', error)
      setRefunds([])
    } finally {
      setLoadingRefunds(false)
    }
  }

  const formatAmount = (amount) => {
    return `₹${(amount / 100).toFixed(2)}`
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-IN')
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case 'success':
        return 'success'
      case 'failed':
        return 'failed'
      case 'processing':
        return 'processing'
      case 'processed':
        return 'success'
      default:
        return 'default'
    }
  }

  return (
    <div className="transactions-container">
      <nav className="transactions-nav">
        <h1 className="transactions-nav-title">Payment Gateway Dashboard</h1>
        <Link to="/dashboard" className="transactions-back-link">
          <button className="back-button">← Back to Dashboard</button>
        </Link>
      </nav>

      <div className="transactions-content">
        <div className="transactions-card">
          <h2 className="transactions-heading">All Transactions</h2>

          {loading ? (
            <p className="transactions-loading">Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <p className="transactions-no-data">No transactions yet. Create an order via API to see transactions here.</p>
          ) : (
            <div className="transactions-table-container">
              <table data-test-id="transactions-table" className="transactions-table">
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>Order ID</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr
                      key={txn.id}
                      data-test-id="transaction-row"
                      data-payment-id={txn.id}
                    >
                      <td data-test-id="payment-id">{txn.id}</td>
                      <td data-test-id="order-id">{txn.order_id}</td>
                      <td data-test-id="amount">{formatAmount(txn.amount)}</td>
                      <td data-test-id="method">{txn.method}</td>
                      <td data-test-id="status">
                        <span 
                          className={`transactions-badge transactions-badge-${getStatusStyle(txn.status)}`}
                          style={
                            txn.status === 'success' ? { background: '#48bb78', color: 'white' } :
                            txn.status === 'failed' ? { background: '#f56565', color: 'white' } :
                            txn.status === 'processing' ? { background: '#ed8936', color: 'white' } :
                            { background: '#718096', color: 'white' }
                          }
                        >
                          {txn.status}
                        </span>
                      </td>
                      <td data-test-id="created-at">
                        {formatDate(txn.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="transactions-card" style={{ marginTop: '24px' }}>
          <h2 className="transactions-heading">Refund Transactions</h2>
          {loadingRefunds ? (
            <p className="transactions-loading">Loading refunds...</p>
          ) : refunds.length === 0 ? (
            <p className="transactions-no-data">No refunds yet. Create a refund to see it tracked here.</p>
          ) : (
            <div className="transactions-table-container">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Refund ID</th>
                    <th>Payment ID</th>
                    <th>Amount</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.map((refund) => (
                    <tr key={refund.id}>
                      <td>{refund.id}</td>
                      <td>{refund.payment_id}</td>
                      <td>{formatAmount(refund.amount)}</td>
                      <td>{refund.reason}</td>
                      <td>
                        <span className={`transactions-badge transactions-badge-${getStatusStyle(refund.status)}`}
                          style={{ background: '#3b82f6', color: 'white' }}>
                          {refund.status}
                        </span>
                      </td>
                      <td>{formatDate(refund.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Transactions
