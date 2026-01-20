import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Checkout from './pages/Checkout'
import { API_URL } from './config'
import './App.css'

function WebhookConfig() {
  const navigate = useNavigate()
  const [webhookUrl, setWebhookUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [logs, setLogs] = useState([])
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [queueStats, setQueueStats] = useState(null)

  const apiKey = localStorage.getItem('apiKey')
  const apiSecret = localStorage.getItem('apiSecret')

  useEffect(() => {
    if (!apiKey || !apiSecret) {
      navigate('/login')
      return
    }
    fetchConfig()
    fetchLogs()
    fetchQueue()
  }, [])

  const authHeaders = {
    'X-Api-Key': apiKey,
    'X-Api-Secret': apiSecret,
  }

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_URL}/webhooks/config`, { headers: authHeaders })
      if (res.ok) {
        const data = await res.json()
        setWebhookUrl(data.webhook_url || '')
      }
    } catch (error) {
      console.error('Load webhook config failed', error)
    }
  }

  const fetchLogs = async () => {
    setLoadingLogs(true)
    try {
      const res = await fetch(`${API_URL}/webhooks/logs?limit=20`, { headers: authHeaders })
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Load webhook logs failed', error)
    } finally {
      setLoadingLogs(false)
    }
  }

  const fetchQueue = async () => {
    try {
      const res = await fetch(`${API_URL}/queue/status`)
      if (res.ok) {
        const data = await res.json()
        setQueueStats(data.webhooks)
      }
    } catch (error) {
      console.error('Load queue stats failed', error)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch(`${API_URL}/webhooks/config`, {
        method: 'PUT',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ webhook_url: webhookUrl.trim() }),
      })

      if (!res.ok) {
        const err = await res.json()
        setMessage(err.error || 'Unable to update webhook URL')
        return
      }

      setMessage('Webhook URL saved and live for new events.')
      fetchLogs()
      fetchQueue()
    } catch (error) {
      console.error('Save webhook failed', error)
      setMessage('Unexpected error while saving webhook URL.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-container">
      <nav className="subnav">
        <h1 className="subnav-title">Payment Gateway Dashboard</h1>
        <button onClick={() => navigate('/dashboard')} className="back-button">← Back to Dashboard</button>
      </nav>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Webhook Control Center</h1>
            <p className="page-description">
              Configure your delivery URL, monitor queue health, and inspect recent webhook attempts.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="chip chip-primary">Signed with HMAC-SHA256</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '18px', marginBottom: '18px' }}>
          <div className="card">
            <div className="section-title">Webhook destination</div>
            <div className="section-subtitle">Events are sent with header X-Webhook-Signature using your API secret.</div>
            <form onSubmit={handleSave} style={{ display: 'grid', gap: '14px' }}>
              <label className="form-label">Delivery URL</label>
              <input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://example.com/webhooks"
                className="form-input"
              />
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="submit"
                  disabled={saving}
                  className="gradient-button"
                  style={{ opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Saving...' : 'Save URL'}
                </button>
                {message && <span style={{ color: '#a5f3fc' }}>{message}</span>}
              </div>
            </form>
          </div>

          <div className="card">
            <div className="section-title">Delivery queue</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: '10px' }}>
              {queueStats ? (
                Object.entries(queueStats).map(([key, value]) => (
                  <div key={key} style={{ background: '#0f172a', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>{key}</div>
                    <div style={{ color: '#f8fafc', fontSize: '26px', fontWeight: 800 }}>{value}</div>
                  </div>
                ))
              ) : (
                <div style={{ color: '#94a3b8' }}>Queue stats loading...</div>
              )}
            </div>
            <button
              onClick={() => {
                fetchQueue()
                fetchLogs()
              }}
              style={{ marginTop: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#cbd5e1', padding: '10px 14px', borderRadius: '10px', cursor: 'pointer' }}
            >
              Refresh status
            </button>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <div className="section-title">Recent deliveries</div>
              <div className="section-subtitle">Last 20 webhook attempts with status, event type, and timestamps.</div>
            </div>
          </div>
          {loadingLogs ? (
            <div style={{ color: '#94a3b8' }}>Loading logs...</div>
          ) : logs.length === 0 ? (
            <div style={{ color: '#94a3b8' }}>No webhook attempts yet. Trigger a payment or refund to generate an event.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Webhook ID</th>
                    <th>Status</th>
                    <th>Response</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 600 }}>{log.event_type}</td>
                      <td className="mono">{log.id}</td>
                      <td>
                        <span className={`status-badge status-${log.status}`}>{log.status}</span>
                      </td>
                      <td style={{ color: '#cbd5e1' }}>
                        {log.response_status ? `HTTP ${log.response_status}` : '—'}
                      </td>
                      <td style={{ color: '#cbd5e1' }}>
                        {new Date(log.created_at).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gap: '18px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <div className="card">
            <div className="section-title">Verify signatures</div>
            <div className="section-subtitle">Use API secret to validate X-Webhook-Signature.</div>
            <pre className="code-block">
              {`const crypto = require('crypto');
              const valid = crypto
                .createHmac('sha256', apiSecret)
                .update(JSON.stringify(body))
                .digest('hex') === req.headers['x-webhook-signature'];`}
            </pre>
          </div>
          <div className="card">
            <div className="section-title">Test endpoints</div>
            <div style={{ color: '#9ca3af', lineHeight: 1.5 }}>
              <div>1) Create order → POST /api/v1/orders</div>
              <div>2) Create payment → POST /api/v1/payments</div>
              <div>3) Webhook fires on payment/ refund events</div>
              <div>4) See delivery attempts above</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RefundManagement() {
  const navigate = useNavigate()
  const [refunds, setRefunds] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [paymentId, setPaymentId] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('Customer requested refund')
  const [formError, setFormError] = useState('')

  const apiKey = localStorage.getItem('apiKey')
  const apiSecret = localStorage.getItem('apiSecret')

  useEffect(() => {
    if (!apiKey || !apiSecret) {
      navigate('/login')
      return
    }
    fetchRefunds()
  }, [])

  const authHeaders = {
    'X-Api-Key': apiKey,
    'X-Api-Secret': apiSecret,
    'Content-Type': 'application/json',
  }

  const fetchRefunds = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/refunds`, { headers: authHeaders })
      if (res.ok) {
        const data = await res.json()
        setRefunds(data.refunds || [])
      }
    } catch (error) {
      console.error('Load refunds failed', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRefund = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!paymentId) {
      setFormError('Payment ID is required')
      return
    }

    const amountInPaise = amount ? Math.round(parseFloat(amount) * 100) : undefined
    setCreating(true)
    try {
      const res = await fetch(`${API_URL}/refunds`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ payment_id: paymentId, amount: amountInPaise, reason }),
      })

      if (!res.ok) {
        const err = await res.json()
        setFormError(err.error || 'Unable to create refund')
        return
      }

      setPaymentId('')
      setAmount('')
      setReason('Customer requested refund')
      fetchRefunds()
    } catch (error) {
      console.error('Create refund failed', error)
      setFormError('Unexpected error while creating refund')
    } finally {
      setCreating(false)
    }
  }

  const formatAmount = (value) => `₹${(value / 100).toFixed(2)}`

  return (
    <div className="page-container">
      <nav className="subnav">
        <h1 className="subnav-title">Payment Gateway Dashboard</h1>
        <button onClick={() => navigate('/dashboard')} className="back-button">← Back to Dashboard</button>
      </nav>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Refund Desk</h1>
            <p className="page-description">
              Create refunds, monitor status, and keep customers in the loop.
            </p>
          </div>
          <div className="chip chip-success">Asynchronous + Webhook-backed</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
          <div className="card">
            <div className="section-title">Create a refund</div>
            <div className="section-subtitle">Partial refunds supported. Amount in INR; we convert to paise.</div>
            <form onSubmit={handleCreateRefund} style={{ display: 'grid', gap: '12px' }}>
              <label className="form-label">Payment ID</label>
              <input
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
                placeholder="pay_..."
                className="form-input"
                style={{ padding: '12px' }}
              />

              <label className="form-label">Amount (₹) — optional</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Leave empty for full refund"
                className="form-input"
                style={{ padding: '12px' }}
              />

              <label className="form-label">Reason</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="form-input"
                style={{ padding: '12px' }}
              />

              {formError && <div style={{ color: '#fca5a5' }}>{formError}</div>}

              <button
                type="submit"
                disabled={creating}
                className="gradient-button gradient-button-green"
                style={{
                  marginTop: '6px',
                  opacity: creating ? 0.7 : 1,
                }}
              >
                {creating ? 'Creating...' : 'Create refund'}
              </button>
            </form>
          </div>

          <div className="card">
            <div className="section-title">How it works</div>
            <ul style={{ color: '#cbd5e1', lineHeight: 1.6, marginLeft: '16px' }}>
              <li>We validate payment ownership and amount caps.</li>
              <li>Refund status starts at <strong>created</strong> and moves via worker + webhook.</li>
              <li>Use idempotency keys on API side to avoid duplicates.</li>
              <li>Track delivery in the Webhook Control Center.</li>
            </ul>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <div className="section-title">Recent refunds</div>
              <div className="section-subtitle">Latest 50 refunds for your account.</div>
            </div>
            <button
              onClick={fetchRefunds}
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#cbd5e1', padding: '10px 14px', borderRadius: '10px', cursor: 'pointer' }}
            >
              Refresh list
            </button>
          </div>

          {loading ? (
            <div style={{ color: '#94a3b8' }}>Loading refunds...</div>
          ) : refunds.length === 0 ? (
            <div style={{ color: '#94a3b8' }}>No refunds yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ minWidth: '700px' }}>
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
                      <td className="mono">{refund.id}</td>
                      <td className="mono">{refund.payment_id}</td>
                      <td style={{ fontWeight: 700 }}>{formatAmount(refund.amount)}</td>
                      <td style={{ color: '#cbd5e1' }}>{refund.reason}</td>
                      <td><span className={`status-badge status-${refund.status}`}>{refund.status}</span></td>
                      <td style={{ color: '#cbd5e1' }}>{new Date(refund.created_at).toLocaleString('en-IN')}</td>
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

function ApiDocumentation() {
  const navigate = useNavigate()
  const apiKey = localStorage.getItem('apiKey')
  const apiSecret = localStorage.getItem('apiSecret')

  const codeBlock = `curl -X POST ${API_URL}/payments \\
  -H 'X-Api-Key: ${apiKey || 'your_api_key'}' \\
  -H 'X-Api-Secret: ${apiSecret || 'your_api_secret'}' \\
  -H 'Content-Type: application/json' \\
  -d '{"order_id":"order_123","method":"upi","vpa":"test@upi"}'`

  return (
    <div className="page-container">
      <nav className="subnav">
        <h1 className="subnav-title">Payment Gateway Dashboard</h1>
        <button onClick={() => navigate('/dashboard')} className="back-button">← Back to Dashboard</button>
      </nav>
      <div className="page-content" style={{ maxWidth: '1100px' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">API Launchpad</h1>
            <p className="page-description">
              Core flows, required headers, and sample requests to get you live quickly.
            </p>
          </div>
          <div className="chip chip-warning">Sandbox ready</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <div className="card">
            <div className="section-title">Authenticate</div>
            <div style={{ color: '#cbd5e1', lineHeight: 1.6 }}>
              Send headers <strong>X-Api-Key</strong> and <strong>X-Api-Secret</strong> on every request.
              Keys are visible on the dashboard home.
            </div>
          </div>
          <div className="card">
            <div className="section-title">Create order</div>
            <div style={{ color: '#cbd5e1', lineHeight: 1.6 }}>POST /api/v1/orders with amount (paise), currency, and receipt.</div>
          </div>
          <div className="card">
            <div className="section-title">Collect payment</div>
            <div style={{ color: '#cbd5e1', lineHeight: 1.6 }}>POST /api/v1/payments with order_id and method (upi/card). Status is synchronous for demo.</div>
          </div>
          <div className="card">
            <div className="section-title">Refund</div>
            <div style={{ color: '#cbd5e1', lineHeight: 1.6 }}>POST /api/v1/refunds with payment_id. Webhooks fire on refund.created.</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
          <div className="card">
            <div className="section-title">Sample request (cURL)</div>
            <pre className="code-block" style={{ padding: '16px' }}>{codeBlock}</pre>
          </div>
          <div className="card">
            <div className="section-title">HTTP responses</div>
            <ul style={{ color: '#cbd5e1', lineHeight: 1.6, marginLeft: '16px' }}>
              <li>201 Created – success</li>
              <li>400 Bad Request – validation error</li>
              <li>401 Unauthorized – missing/invalid keys</li>
              <li>500 Server Error – something went wrong</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/dashboard/transactions" element={<Transactions />} />
      <Route path="/dashboard/webhooks" element={<WebhookConfig />} />
      <Route path="/dashboard/refunds" element={<RefundManagement />} />
      <Route path="/dashboard/checkout" element={<Checkout />} />
      <Route path="/dashboard/docs" element={<ApiDocumentation />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
