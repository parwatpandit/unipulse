import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'
import { removeToken } from '../utils/auth'

interface Profile {
  full_name: string
  email: string
  course: string
  course_start_year: number
  country: string
  sex: string
  relationship_status: string
  profile_picture_url: string | null
}

function Settings() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState('')
  const [course, setCourse] = useState('')
  const [country, setCountry] = useState('')
  const [relationshipStatus, setRelationshipStatus] = useState('')
  const [profilePic, setProfilePic] = useState<File | null>(null)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saved, setSaved] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/me')
      setProfile(res.data)
      setFullName(res.data.full_name || '')
      setCourse(res.data.course || '')
      setCountry(res.data.country || '')
      setRelationshipStatus(res.data.relationship_status || '')
    } catch {
      navigate('/login')
    }
  }

  const handleUpdateProfile = async () => {
    setError('')
    try {
      await api.put('/users/me', { full_name: fullName, course, country, relationship_status: relationshipStatus })
      setSaved('Profile updated.')
      setTimeout(() => setSaved(''), 2000)
    } catch {
      setError('Failed to update profile.')
    }
  }

  const handleUpdatePicture = async () => {
    if (!profilePic) return
    setError('')
    try {
      const formData = new FormData()
      formData.append('image', profilePic)
      await api.post('/users/profile-picture', formData)
      setSaved('Profile picture updated.')
      setTimeout(() => setSaved(''), 2000)
    } catch {
      setError('Failed to update picture.')
    }
  }

  const handleChangePassword = async () => {
    setError('')
    try {
      await api.post('/auth/change-password', { old_password: oldPassword, new_password: newPassword })
      setOldPassword('')
      setNewPassword('')
      setSaved('Password changed.')
      setTimeout(() => setSaved(''), 2000)
    } catch {
      setError('Failed to change password.')
    }
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

        {saved && <p className="text-green-600 text-sm mb-4">{saved}</p>}
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        {/* Profile Info */}
        {profile && (
          <div className="border p-4 mb-4">
            <p className="text-sm font-medium mb-2">Your Profile</p>
            <p className="text-sm mb-1"><span className="font-medium">Email:</span> {profile.email}</p>
            <p className="text-sm"><span className="font-medium">Sex:</span> {profile.sex}</p>
          </div>
        )}

        {/* Update Profile */}
        <div className="border p-4 mb-4">
          <p className="text-sm font-medium mb-3">Update Profile</p>
          <div className="mb-3">
            <label className="block mb-1 text-sm">Full Name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border px-3 py-2 text-sm" />
          </div>
          <div className="mb-3">
            <label className="block mb-1 text-sm">Course</label>
            <input type="text" value={course} onChange={(e) => setCourse(e.target.value)} className="w-full border px-3 py-2 text-sm" />
          </div>
          <div className="mb-3">
            <label className="block mb-1 text-sm">Country</label>
            <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full border px-3 py-2 text-sm" />
          </div>
          <div className="mb-3">
            <label className="block mb-1 text-sm">Relationship Status</label>
            <select value={relationshipStatus} onChange={(e) => setRelationshipStatus(e.target.value)} className="w-full border px-3 py-2 text-sm">
              <option value="single">Single</option>
              <option value="taken">Taken</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
          <button onClick={handleUpdateProfile} className="bg-black text-white px-4 py-2 text-sm">Save</button>
        </div>

        {/* Update Profile Picture */}
        <div className="border p-4 mb-4">
          <p className="text-sm font-medium mb-3">Update Profile Picture</p>
          <input type="file" accept="image/*" onChange={(e) => setProfilePic(e.target.files?.[0] || null)} className="text-sm mb-2" />
          <br />
          <button onClick={handleUpdatePicture} className="bg-black text-white px-4 py-2 text-sm">Upload</button>
        </div>

        {/* Change Password */}
        <div className="border p-4 mb-4">
          <p className="text-sm font-medium mb-3">Change Password</p>
          <div className="mb-3">
            <label className="block mb-1 text-sm">Old Password</label>
            <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="w-full border px-3 py-2 text-sm" />
          </div>
          <div className="mb-3">
            <label className="block mb-1 text-sm">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border px-3 py-2 text-sm" />
          </div>
          <button onClick={handleChangePassword} className="bg-black text-white px-4 py-2 text-sm">Change Password</button>
        </div>

        {/* Logout */}
        <div className="border p-4">
          <button onClick={handleLogout} className="border px-4 py-2 text-sm">Logout</button>
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