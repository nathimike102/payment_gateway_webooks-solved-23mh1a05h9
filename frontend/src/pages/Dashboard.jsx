import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const API_URL = 'http://localhost:8000'

function Dashboard() {
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    successRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const apiKey = localStorage.getItem('apiKey')
  const apiSecret = localStorage.getItem('apiSecret')
  const email = localStorage.getItem('merchantEmail')

  useEffect(() => {
    if (!apiKey || !apiSecret) {
      navigate('/login')
      return
    }

    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Fetch all payments for this merchant
      const response = await fetch(`${API_URL}/api/v1/payments`, {
        headers: {
          'X-Api-Key': apiKey,
          'X-Api-Secret': apiSecret,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const payments = data.payments || data || []
        
        const totalTransactions = payments.length
        const successfulPayments = payments.filter(p => p.status === 'success')
        // Sum amounts from all transactions (amounts are in paise)
        const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
        const successRate = totalTransactions > 0 
          ? ((successfulPayments.length / totalTransactions) * 100).toFixed(0)
          : 0

        setStats({
          totalTransactions,
          totalAmount,
          successRate,
        })
      } else {
        // If endpoint doesn't exist or no data, use defaults
        setStats({
          totalTransactions: 0,
          totalAmount: 0,
          successRate: 0,
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      setStats({
        totalTransactions: 0,
        totalAmount: 0,
        successRate: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (amount) => {
    const rupees = amount / 100
    return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <h1 style={styles.navTitle}>Payment Gateway Dashboard</h1>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </nav>

      <div style={styles.content}>
        <div data-test-id="dashboard" style={styles.dashboard}>
          <h2 style={styles.heading}>Welcome, {email}</h2>

          <div data-test-id="api-credentials" style={styles.credentials}>
            <h3 style={styles.subheading}>API Credentials</h3>
            <div style={styles.credentialRow}>
              <label style={styles.label}>API Key</label>
              <span data-test-id="api-key" style={styles.value}>{apiKey}</span>
            </div>
            <div style={styles.credentialRow}>
              <label style={styles.label}>API Secret</label>
              <span data-test-id="api-secret" style={styles.value}>{apiSecret}</span>
            </div>
          </div>

          <div data-test-id="stats-container" style={styles.statsContainer}>
            <h3 style={styles.subheading}>Statistics</h3>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Total Transactions</div>
                <div data-test-id="total-transactions" style={styles.statValue}>
                  {loading ? '...' : stats.totalTransactions}
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Total Amount</div>
                <div data-test-id="total-amount" style={styles.statValue}>
                  {loading ? '...' : formatAmount(stats.totalAmount)}
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Success Rate</div>
                <div data-test-id="success-rate" style={styles.statValue}>
                  {loading ? '...' : `${stats.successRate}%`}
                </div>
              </div>
            </div>
          </div>

          <Link to="/dashboard/transactions" style={styles.link}>
            <button style={styles.button}>View All Transactions</button>
          </Link>
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
    background: '#0056b3',
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
  logoutBtn: {
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
    maxWidth: '1200px',
    margin: '0 auto',
  },
  dashboard: {
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
  subheading: {
    fontSize: '20px',
    marginBottom: '20px',
    color: '#555',
  },
  credentials: {
    marginBottom: '40px',
    padding: '20px',
    background: '#f7fafc',
    borderRadius: '8px',
  },
  credentialRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 0',
    borderBottom: '1px solid #e2e8f0',
  },
  label: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#555',
  },
  value: {
    fontSize: '16px',
    fontFamily: 'monospace',
    color: '#ff8c00',
    background: 'white',
    padding: '5px 10px',
    borderRadius: '4px',
  },
  statsContainer: {
    marginBottom: '30px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  statCard: {
    background: '#0056b3',
    color: 'white',
    padding: '30px',
    borderRadius: '10px',
    textAlign: 'center',
    boxShadow: '0 4px 15px rgba(0, 86, 179, 0.3)',
  },
  statLabel: {
    fontSize: '14px',
    opacity: 0.9,
    marginBottom: '10px',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
  },
  link: {
    textDecoration: 'none',
  },
  button: {
    padding: '12px 30px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    background: '#ff8c00',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    width: '100%',
  },
}

export default Dashboard
