import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const API_URL = 'http://localhost:8000'

function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const apiKey = localStorage.getItem('apiKey')
  const apiSecret = localStorage.getItem('apiSecret')

  useEffect(() => {
    if (!apiKey || !apiSecret) {
      navigate('/login')
      return
    }

    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      // Since we don't have a list all payments endpoint, we'll query the database differently
      // For now, we'll show empty or use a workaround
      // In production, you'd add a GET /api/v1/payments endpoint that lists all
      setTransactions([])
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
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
        return { background: '#48bb78', color: 'white' }
      case 'failed':
        return { background: '#f56565', color: 'white' }
      case 'processing':
        return { background: '#ed8936', color: 'white' }
      default:
        return { background: '#718096', color: 'white' }
    }
  }

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <h1 style={styles.navTitle}>Payment Gateway Dashboard</h1>
        <Link to="/dashboard" style={styles.backLink}>
          <button style={styles.backBtn}>← Back to Dashboard</button>
        </Link>
      </nav>

      <div style={styles.content}>
        <div style={styles.card}>
          <h2 style={styles.heading}>All Transactions</h2>

          {loading ? (
            <p style={styles.loading}>Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <p style={styles.noData}>No transactions yet. Create an order via API to see transactions here.</p>
          ) : (
            <div style={styles.tableContainer}>
              <table data-test-id="transactions-table" style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Payment ID</th>
                    <th style={styles.th}>Order ID</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Method</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr
                      key={txn.id}
                      data-test-id="transaction-row"
                      data-payment-id={txn.id}
                      style={styles.tr}
                    >
                      <td data-test-id="payment-id" style={styles.td}>{txn.id}</td>
                      <td data-test-id="order-id" style={styles.td}>{txn.order_id}</td>
                      <td data-test-id="amount" style={styles.td}>{txn.amount}</td>
                      <td data-test-id="method" style={styles.td}>{txn.method}</td>
                      <td data-test-id="status" style={styles.td}>
                        <span style={{ ...styles.badge, ...getStatusStyle(txn.status) }}>
                          {txn.status}
                        </span>
                      </td>
                      <td data-test-id="created-at" style={styles.td}>
                        {formatDate(txn.created_at)}
                      </td>
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

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
  },
  nav: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '20px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  navTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
  },
  backLink: {
    textDecoration: 'none',
  },
  backBtn: {
    padding: '8px 20px',
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: '1px solid white',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  content: {
    padding: '40px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  card: {
    background: 'white',
    borderRadius: '10px',
    padding: '30px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  heading: {
    fontSize: '28px',
    marginBottom: '30px',
    color: '#333',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    fontSize: '16px',
  },
  noData: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    fontSize: '16px',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '15px',
    background: '#f7fafc',
    borderBottom: '2px solid #e2e8f0',
    fontWeight: '600',
    color: '#555',
  },
  tr: {
    borderBottom: '1px solid #e2e8f0',
  },
  td: {
    padding: '15px',
    color: '#666',
  },
  badge: {
    padding: '5px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
}

export default Transactions
