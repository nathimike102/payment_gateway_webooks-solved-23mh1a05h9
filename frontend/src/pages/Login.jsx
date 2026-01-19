import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

import { API_URL } from '../config'
import './Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.description || 'Login failed')
        return
      }

      // Store merchant data
      localStorage.setItem('merchantId', data.merchant.id)
      localStorage.setItem('merchantEmail', data.merchant.email)
      localStorage.setItem('merchantName', data.merchant.name)
      localStorage.setItem('apiKey', data.merchant.apiKey)
      localStorage.setItem('apiSecret', data.merchant.apiSecret)

      navigate('/dashboard')
    } catch (err) {
      setError('Network error. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Payment Gateway</h1>
        <h2 className="login-subtitle">Merchant Login</h2>
        
        <form data-test-id="login-form" onSubmit={handleSubmit} className="login-form">
          <input
            data-test-id="email-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="login-input"
          />
          <input
            data-test-id="password-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="login-input"
          />
          {error && <div className="login-error">{error}</div>}
          <button 
            data-test-id="login-button" 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-signup-link">
          Don't have an account? <Link to="/signup" className="login-link">Sign up here</Link>
        </div>
        
        <div className="login-hint">
          <p><strong>Test Credentials:</strong></p>
          <p>Email: test@example.com</p>
          <p>Password: test123</p>
        </div>
      </div>
    </div>
  )
}

export default Login
