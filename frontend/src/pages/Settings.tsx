import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'
import { removeToken } from '../utils/auth'
import ReactCrop from 'react-image-crop'
import type { Crop, PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

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
  const [imgSrc, setImgSrc] = useState('')
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const imgRef = useRef<HTMLImageElement>(null)
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImgSrc(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleUpdatePicture = async () => {
    if (!completedCrop || !imgRef.current) return
    const canvas = document.createElement('canvas')
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height
    canvas.width = completedCrop.width
    canvas.height = completedCrop.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0,
      completedCrop.width,
      completedCrop.height
    )
    canvas.toBlob(async (blob) => {
      if (!blob) return
      const formData = new FormData()
      formData.append('image', blob, 'profile.jpg')
      try {
        await api.post('/users/profile-picture', formData)
        setSaved('Profile picture updated.')
        setImgSrc('')
        setTimeout(() => setSaved(''), 2000)
      } catch {
        setError('Failed to update picture.')
      }
    }, 'image/jpeg')
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
      <div className="border-b px-6 py-3 flex items-center justify-between sticky top-0 bg-white z-50">
        <span className="text-xl font-bold cursor-pointer" onClick={() => { window.location.href = '/home' }}>UniPulse</span>
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
          <label className="cursor-pointer border px-4 py-2 text-sm inline-block">
            Choose Image
            <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </label>
          {imgSrc && (
            <div className="mt-3">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                circularCrop
                aspect={1}
              >
                <img ref={imgRef} src={imgSrc} style={{ maxWidth: '100%' }} />
              </ReactCrop>
              <br />
              <button onClick={handleUpdatePicture} className="mt-3 bg-black text-white px-4 py-2 text-sm">
                Save Picture
              </button>
            </div>
          )}
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