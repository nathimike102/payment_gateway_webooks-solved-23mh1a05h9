import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

import { API_URL } from '../config'
import './Dashboard.css'

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
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <h1 className="dashboard-nav-title">Payment Gateway Dashboard</h1>
        <button onClick={handleLogout} className="dashboard-logout-btn">Logout</button>
      </nav>

      <div className="dashboard-content">
        <div data-test-id="dashboard" className="dashboard-main">
          <h2 className="dashboard-heading">Welcome, {email}</h2>

          <div data-test-id="api-credentials" className="dashboard-credentials">
            <h3 className="dashboard-subheading">API Credentials</h3>
            <div className="dashboard-credential-row">
              <label className="dashboard-label">API Key</label>
              <span data-test-id="api-key" className="dashboard-value">{apiKey}</span>
            </div>
            <div className="dashboard-credential-row">
              <label className="dashboard-label">API Secret</label>
              <span data-test-id="api-secret" className="dashboard-value">{apiSecret}</span>
            </div>
          </div>

          <div data-test-id="stats-container" className="dashboard-stats-container">
            <h3 className="dashboard-subheading">Statistics</h3>
            <div className="dashboard-stats-grid">
              <div className="dashboard-stat-card">
                <div className="dashboard-stat-label">Total Transactions</div>
                <div data-test-id="total-transactions" className="dashboard-stat-value">
                  {loading ? '...' : stats.totalTransactions}
                </div>
              </div>
              <div className="dashboard-stat-card">
                <div className="dashboard-stat-label">Total Amount</div>
                <div data-test-id="total-amount" className="dashboard-stat-value">
                  {loading ? '...' : formatAmount(stats.totalAmount)}
                </div>
              </div>
              <div className="dashboard-stat-card">
                <div className="dashboard-stat-label">Success Rate</div>
                <div data-test-id="success-rate" className="dashboard-stat-value">
                  {loading ? '...' : `${stats.successRate}%`}
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-button-group">
            <Link to="/dashboard/transactions" className="dashboard-link">
              <button className="dashboard-button">View All Transactions</button>
            </Link>
            <Link to="/dashboard/webhooks" className="dashboard-link">
              <button className="dashboard-button">Webhook Configuration</button>
            </Link>
            <Link to="/dashboard/refunds" className="dashboard-link">
              <button className="dashboard-button">Refund Management</button>
            </Link>
            <Link to="/dashboard/docs" className="dashboard-link">
              <button className="dashboard-button">API Documentation</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
