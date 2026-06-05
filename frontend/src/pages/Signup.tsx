import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'

function Signup() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [studentId, setStudentId] = useState('')
  const [dob, setDob] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSignup = async () => {
    setError('')
    setSuccess('')
    try {
      await api.post('/auth/signup', {
        email,
        student_id: studentId,
        dob,
        password,
      })
      setSuccess('Account created. Please check your email to verify your account.')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Signup failed')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b px-6 py-4 sticky top-0 bg-white z-50">
        <span className="text-2xl font-bold cursor-pointer" onClick={() => { window.location.href = '/' }}>UniPulse</span>
      </div>

      <div className="max-w-sm mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold mb-6">Sign Up</h1>

        {error && <p className="text-red-600 mb-4">{error}</p>}
        {success && <p className="text-green-600 mb-4">{success}</p>}

        <div className="mb-4">
          <label className="block mb-1 text-sm">Ulster University Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border px-3 py-2 text-sm"
            placeholder="name@ulster.ac.uk"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-sm">Student ID</label>
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full border px-3 py-2 text-sm"
            placeholder="e.g. 20001780"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-sm">Date of Birth</label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
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
          onClick={handleSignup}
          className="w-full bg-black text-white py-2 text-sm font-medium"
        >
          Sign Up
        </button>

        <p className="mt-4 text-sm">
          Already have an account? <Link to="/login" className="underline">Log in</Link>
        </p>
      </div>
    </div>
  )
}

export default Signup