import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = 'http://localhost:8000'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // For Deliverable 1, accept test@example.com with any password
    if (email === 'test@example.com') {
      // Store merchant data
      localStorage.setItem('merchantEmail', email)
      localStorage.setItem('apiKey', 'key_test_abc123')
      localStorage.setItem('apiSecret', 'secret_test_xyz789')
      navigate('/dashboard')
    } else {
      setError('Invalid credentials. Use test@example.com')
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
            style={styles.input}
          />
          <input
            data-test-id="password-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
          {error && <div style={styles.error}>{error}</div>}
          <button data-test-id="login-button" type="submit" style={styles.button}>
            Login
          </button>
        </form>
        
        <div style={styles.hint}>
          <p>Test Credentials:</p>
          <p>Email: test@example.com</p>
          <p>Password: any</p>
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
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
