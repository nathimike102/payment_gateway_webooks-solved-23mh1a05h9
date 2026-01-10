import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const API_URL = 'http://localhost:8000'

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
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Payment Gateway</h1>
        <h2 style={styles.subtitle}>Merchant Login</h2>
        
        <form data-test-id="login-form" onSubmit={handleSubmit} style={styles.form}>
          <input
            data-test-id="email-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            style={styles.input}
          />
          <input
            data-test-id="password-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            style={styles.input}
          />
          {error && <div style={styles.error}>{error}</div>}
          <button 
            data-test-id="login-button" 
            type="submit" 
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={styles.signupLink}>
          Don't have an account? <Link to="/signup" style={styles.link}>Sign up here</Link>
        </div>
        
        <div style={styles.hint}>
          <p><strong>Test Credentials:</strong></p>
          <p>Email: test@example.com</p>
          <p>Password: test123</p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0056b3',
  },
  card: {
    background: 'white',
    padding: '40px',
    borderRadius: '10px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '10px',
    color: '#333',
  },
  subtitle: {
    fontSize: '18px',
    textAlign: 'center',
    marginBottom: '30px',
    color: '#666',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  input: {
    padding: '12px 15px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    outline: 'none',
    transition: 'border 0.3s',
  },
  button: {
    padding: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    background: '#ff8c00',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  error: {
    color: '#e53e3e',
    fontSize: '14px',
    textAlign: 'center',
  },
  signupLink: {
    marginTop: '15px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#666',
  },
  link: {
    color: '#ff8c00',
    textDecoration: 'none',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  hint: {
    marginTop: '20px',
    padding: '15px',
    background: '#f7fafc',
    borderRadius: '5px',
    fontSize: '14px',
    color: '#666',
    textAlign: 'center',
  },
}

export default Login
