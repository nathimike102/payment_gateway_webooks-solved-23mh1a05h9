import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'

// Placeholder components for new features
function WebhookConfig() {
  const navigate = require('react-router-dom').useNavigate()
  return (
    <div style={{ padding: '40px' }}>
      <button onClick={() => navigate('/dashboard')} style={{ marginBottom: '20px' }}>← Back to Dashboard</button>
      <h1 style={{ color: '#1f2937' }}>Webhook Configuration</h1>
      <p style={{ fontSize: '16px', color: '#6b7280' }}>Configure your webhook URLs and manage delivery logs here.</p>
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
        <h3>Webhook URL Configuration</h3>
        <p>Webhook events will be sent to your configured URL with HMAC-SHA256 signatures.</p>
        <p style={{ marginTop: '10px' }}><strong>Supported Events:</strong> payment.created, refund.created</p>
      </div>
    </div>
  )
}

function RefundManagement() {
  const navigate = require('react-router-dom').useNavigate()
  return (
    <div style={{ padding: '40px' }}>
      <button onClick={() => navigate('/dashboard')} style={{ marginBottom: '20px' }}>← Back to Dashboard</button>
      <h1 style={{ color: '#1f2937' }}>Refund Management</h1>
      <p style={{ fontSize: '16px', color: '#6b7280' }}>View and manage refunds for your payments.</p>
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
        <p>Create refunds via API: <code>POST /api/v1/refunds</code></p>
        <p style={{ marginTop: '10px' }}>All refunds are processed asynchronously with webhook notifications.</p>
      </div>
    </div>
  )
}

function ApiDocumentation() {
  const navigate = require('react-router-dom').useNavigate()
  return (
    <div style={{ padding: '40px' }}>
      <button onClick={() => navigate('/dashboard')} style={{ marginBottom: '20px' }}>← Back to Dashboard</button>
      <h1 style={{ color: '#1f2937' }}>API Documentation</h1>
      <p style={{ fontSize: '16px', color: '#6b7280' }}>Integration guide and API reference documentation.</p>
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
        <h3>Available Endpoints</h3>
        <ul>
          <li><strong>Orders:</strong> POST/GET /api/v1/orders</li>
          <li><strong>Payments:</strong> POST/GET /api/v1/payments</li>
          <li><strong>Refunds:</strong> POST/GET /api/v1/refunds</li>
          <li><strong>Queue Status:</strong> GET /api/v1/queue/status</li>
        </ul>
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
      <Route path="/dashboard/docs" element={<ApiDocumentation />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
