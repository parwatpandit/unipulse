import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'
import { removeToken } from '../utils/auth'

interface Profile {
  full_name: string
  email: string
  bio: string
  course: string
  year_of_study: number
}

function Settings() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [bio, setBio] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/me')
      setProfile(res.data)
      setBio(res.data.bio || '')
    } catch {
      navigate('/login')
    }
  }

  const handleSave = async () => {
    try {
      await api.patch('/users/me', { bio })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {}
  }

  const handleLogout = () => {
    removeToken()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b px-6 py-3 flex items-center justify-between">
        <span className="text-xl font-bold">UniPulse</span>
        <input
          type="text"
          placeholder="Search students or courses..."
          onFocus={() => navigate('/search')}
          className="border px-3 py-1 text-sm w-64"
          readOnly
        />
        <Link to="/notifications" className="text-sm">🔔</Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-20">
        <h1 className="text-xl font-bold mb-4">Settings</h1>

        {profile && (
          <div className="border p-4 mb-4">
            <p className="text-sm mb-1"><span className="font-medium">Name:</span> {profile.full_name}</p>
            <p className="text-sm mb-1"><span className="font-medium">Email:</span> {profile.email}</p>
            <p className="text-sm mb-1"><span className="font-medium">Course:</span> {profile.course}</p>
            <p className="text-sm"><span className="font-medium">Year:</span> {profile.year_of_study}</p>
          </div>
        )}

        <div className="border p-4 mb-4">
          <p className="text-sm font-medium mb-2">Update Bio</p>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full border px-3 py-2 text-sm"
            placeholder="Write something about yourself..."
          />
          <button
            onClick={handleSave}
            className="mt-2 bg-black text-white px-4 py-2 text-sm"
          >
            Save
          </button>
          {saved && <p className="text-xs text-gray-500 mt-1">Saved.</p>}
        </div>

        <div className="border p-4">
          <p className="text-sm font-medium mb-2">Account</p>
          <button
            onClick={handleLogout}
            className="border px-4 py-2 text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t bg-white flex justify-around py-3 text-sm">
        <Link to="/home">Home</Link>
        <Link to="/global-chat">Chat</Link>
        <Link to="/messages">DMs</Link>
        <Link to="/settings">Settings</Link>
      </div>
    </div>
  )
}

export default Settings
