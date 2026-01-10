import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const API_URL = 'http://localhost:8000'

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
      const response = await fetch(`${API_URL}/api/v1/auth/register`, {
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
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Payment Gateway</h1>
        <h2 style={styles.subtitle}>Merchant Registration</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="Business Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
            style={styles.input}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            style={styles.input}
          />
          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}
          <button
            type="submit"
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={styles.loginLink}>
          Already have an account? <Link to="/login" style={styles.link}>Login here</Link>
        </div>

        <div style={styles.info}>
          <p><strong>What you'll get:</strong></p>
          <ul style={styles.list}>
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

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0056b3',
    padding: '20px',
  },
  card: {
    background: 'white',
    padding: '40px',
    borderRadius: '10px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '450px',
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
    padding: '10px',
    background: '#fff5f5',
    borderRadius: '5px',
  },
  success: {
    color: '#22543d',
    fontSize: '14px',
    textAlign: 'center',
    padding: '10px',
    background: '#f0fff4',
    borderRadius: '5px',
  },
  loginLink: {
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
  info: {
    marginTop: '25px',
    padding: '15px',
    background: '#f7fafc',
    borderRadius: '5px',
    fontSize: '13px',
    color: '#666',
  },
  list: {
    margin: '10px 0 0 20px',
    padding: 0,
  },
}

export default Signup
