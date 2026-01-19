import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

import { API_URL } from '../config'
import './Dashboard.css'

function Dashboard() {
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    successRate: 0,
    refundCount: 0,
    refundAmount: 0,
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
      const [paymentsRes, refundsRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/payments`, {
          headers: {
            'X-Api-Key': apiKey,
            'X-Api-Secret': apiSecret,
          },
        }),
        fetch(`${API_URL}/api/v1/refunds`, {
          headers: {
            'X-Api-Key': apiKey,
            'X-Api-Secret': apiSecret,
          },
        }),
      ])

      const paymentsData = paymentsRes.ok ? await paymentsRes.json() : { payments: [] }
      const refundsData = refundsRes.ok ? await refundsRes.json() : { refunds: [] }

      const payments = paymentsData.payments || []
      const refunds = refundsData.refunds || []

      const totalPaymentAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
      const totalRefundAmount = refunds.reduce((sum, r) => sum + (r.amount || 0), 0)

      const totalTransactions = payments.length + refunds.length
      const successfulPayments = payments.filter((p) => p.status === 'success')
      const successRate = payments.length > 0
        ? ((successfulPayments.length / payments.length) * 100).toFixed(0)
        : 0

      setStats({
        totalTransactions,
        totalAmount: Math.max(totalPaymentAmount - totalRefundAmount, 0),
        successRate,
        refundCount: refunds.length,
        refundAmount: totalRefundAmount,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      setStats({
        totalTransactions: 0,
        totalAmount: 0,
        successRate: 0,
        refundCount: 0,
        refundAmount: 0,
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
              <div className="dashboard-stat-card">
                <div className="dashboard-stat-label">Total Refunds</div>
                <div className="dashboard-stat-value">
                  {loading ? '...' : stats.refundCount}
                </div>
              </div>
              <div className="dashboard-stat-card">
                <div className="dashboard-stat-label">Refunded Amount</div>
                <div className="dashboard-stat-value">
                  {loading ? '...' : formatAmount(stats.refundAmount)}
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
            <Link to="/dashboard/checkout" className="dashboard-link">
              <button className="dashboard-button">Payment Checkout</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
