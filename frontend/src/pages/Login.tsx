import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'
import { setToken } from '../utils/auth'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setError('')
    try {
      const res = await api.post('/auth/login', { email, password })
      setToken(res.data.access_token)
if (!res.data.profile_completed) {
  navigate('/complete-profile')
} else {
  navigate('/home')
}
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b px-6 py-4 sticky top-0 bg-white z-50">
        <span className="text-2xl font-bold cursor-pointer" onClick={() => { window.location.href = '/' }}>UniPulse</span>
      </div>

      <div className="max-w-sm mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold mb-6">Log In</h1>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <div className="mb-4">
          <label className="block mb-1 text-sm">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border px-3 py-2 text-sm"
          />
        </div>

        <div className="mb-6">
          <label className="block mb-1 text-sm">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border px-3 py-2 text-sm"
          />
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-black text-white py-2 text-sm font-medium"
        >
          Log In
        </button>

        <p className="mt-4 text-sm">
          Don't have an account? <Link to="/signup" className="underline">Sign up</Link>
        </p>
        <p className="mt-2 text-sm">
          <Link to="/forgot-password" className="underline">Forgot password?</Link>
        </p>
      </div>
    </div>
  )
}

export default Login