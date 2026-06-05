import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'

interface Profile {
  id: number
  full_name: string
  course: string
  course_start_year: number
  country: string
  sex: string
  relationship_status: string
  profile_picture_url: string | null
  friend_count: number
}

interface Post {
  id: number
  text_content: string
  image_url: string | null
  created_at: string
}

function Profile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [friendStatus, setFriendStatus] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProfile()
    fetchPosts()
  }, [id])

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/users/${id}`)
      setProfile(res.data)
      const friendRes = await api.get(`/friends/status/${id}`)
      setFriendStatus(friendRes.data.status)
    } catch {
      navigate('/login')
    }
  }

  const fetchPosts = async () => {
    try {
      const res = await api.get(`/posts/user/${id}`)
      setPosts(res.data)
    } catch {}
  }

  const handleAddFriend = async () => {
    try {
      await api.post(`/friends/request/${id}`)
      setFriendStatus('pending')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send request')
    }
  }

  if (!profile) return <div className="p-6">Loading...</div>

  return (
    <div className="min-h-screen bg-white">
      {/* Top Nav */}
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

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile Info */}
        <div className="border p-4 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden">
              {profile.profile_picture_url && (
                <img src={profile.profile_picture_url} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold">{profile.full_name}</h1>
              <p className="text-sm text-gray-600">{profile.course}</p>
              <p className="text-sm text-gray-600">{profile.friend_count} friends</p>
            </div>
          </div>

          <div className="text-sm mb-4">
            <p>Started: {profile.course_start_year}</p>
            <p>From: {profile.country}</p>
            <p>Relationship: {profile.relationship_status}</p>
          </div>

          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

          {friendStatus === '' && (
            <button
              onClick={handleAddFriend}
              className="bg-black text-white px-4 py-1 text-sm"
            >
              Add Friend
            </button>
          )}
          {friendStatus === 'pending' && (
            <p className="text-sm text-gray-500">Friend request sent</p>
          )}
          {friendStatus === 'accepted' && (
            <div className="flex gap-3 items-center">
              <p className="text-sm text-gray-500">Friends</p>
              <button
                onClick={() => navigate(`/messages/${id}`)}
                className="bg-black text-white px-4 py-1 text-sm"
              >
                Message
              </button>
            </div>
          )}
        </div>

        {/* Posts */}
        {posts.map((post) => (
          <div key={post.id} className="border p-4 mb-4">
            <p className="text-sm mb-2">{post.text_content}</p>
            {post.image_url && (
              <img src={post.image_url} alt="" className="w-full border" />
            )}
          </div>
        ))}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-white flex justify-around py-3 text-sm">
        <Link to="/home">Home</Link>
        <Link to="/global-chat">Chat</Link>
        <Link to="/messages">DMs</Link>
        <Link to="/settings">Settings</Link>
      </div>
    </div>
  )
}

export default Profile