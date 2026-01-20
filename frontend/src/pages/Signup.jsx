import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

import { API_URL } from '../config'
import './Signup.css'

function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    // Validate inputs
    if (!name || !email || !password || !confirmPassword) {
      setError('All fields are required')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.description || 'Registration failed')
        return
      }

      setSuccess('Registration successful! Redirecting to login...')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      setError('Network error. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h1 className="signup-title">Payment Gateway</h1>
        <h2 className="signup-subtitle">Merchant Registration</h2>

        <form onSubmit={handleSubmit} className="signup-form">
          <input
            type="text"
            placeholder="Business Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
            className="signup-input"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="signup-input"
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="signup-input"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            className="signup-input"
          />
          {error && <div className="signup-error">{error}</div>}
          {success && <div className="signup-success">{success}</div>}
          <button
            type="submit"
            className="signup-button"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="signup-login-link">
          Already have an account? <Link to="/login" className="signup-link">Login here</Link>
        </div>

        <div className="signup-info">
          <p><strong>What you'll get:</strong></p>
          <ul className="signup-list">
            <li>Unique API Key & Secret for authentication</li>
            <li>Access to payment processing dashboard</li>
            <li>Real-time payment status tracking</li>
            <li>Test mode for development</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Signup
