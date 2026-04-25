import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../config'
import './LoginPage.css'

function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('isAmbulance', data.isAmbulance)
        navigate(data.isAmbulance ? '/ambulance' : '/guest')
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (err) {
      setError('Server not reachable. Start server with: npm run server')
    } finally {
      setLoading(false)
    }
  }

  const demoAmbulance = () => {
    setUsername('ambulance1')
    setPassword('demo123')
  }

  return (
    <div className="login-page">
      <div className="login-bg-pattern" />
      <div className="login-card">
        <div className="login-header">
          <div className="ambulance-icon">🚑</div>
          <h1>Emergency Response</h1>
          <p>Bengaluru Ambulance & Traffic System</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Signing in...' : 'Login as Ambulance'}
          </button>
          <button type="button" className="btn-demo" onClick={demoAmbulance}>
            Use Demo Credentials (ambulance1 / demo123)
          </button>
        </form>

        <div className="login-divider">
          <span>or</span>
        </div>

        <button 
          className="btn-guest"
          onClick={() => navigate('/guest')}
        >
          Continue as Guest (No Login)
        </button>
        <p className="guest-hint">See approaching ambulances and move aside</p>

        <div className="demo-tip">
          <strong>Hackathon Demo:</strong> Run on laptop. Use mobile browser with same IP:port for Bluetooth-style demo.
        </div>
      </div>
    </div>
  )
}

export default LoginPage
