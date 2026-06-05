import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-24 pt-20">
        <h1 className="text-4xl font-bold mb-4">The social network for Ulster University students.</h1>
        <p className="text-gray-600 mb-8">Verified students only. No ads. No algorithm. No spam.</p>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/signup')}
            className="px-6 py-2 bg-black text-white font-medium"
          >
            Sign Up
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 border border-black font-medium"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  )
}

export default Landing