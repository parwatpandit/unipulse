import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'
import { getCurrentUserId } from '../utils/auth'
import Navbar from '../components/Navbar'

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
  id: string
  text_content: string
  image_url: string | null
  created_at: string
  like_count: number
  liked: boolean
}

interface LikedUser {
  user_id: string
  full_name: string
  profile_picture_url: string | null
}

function Profile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [friendStatus, setFriendStatus] = useState('')
  const [error, setError] = useState('')
  const [likedUsers, setLikedUsers] = useState<{ [postId: string]: LikedUser[] }>({})
  const [showLiked, setShowLiked] = useState<{ [postId: string]: boolean }>({})

  const currentUserId = getCurrentUserId()
  const isOwnProfile = currentUserId === id

  useEffect(() => {
    fetchProfile()
    fetchPosts()
  }, [id])

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/users/${id}`)
      setProfile(res.data)
      if (!isOwnProfile) {
        const friendRes = await api.get(`/friends/status/${id}`)
        setFriendStatus(friendRes.data.status)
      }
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

  const handleDeletePost = async (postId: string) => {
    try {
      await api.delete(`/posts/${postId}`)
      setPosts(posts.filter(p => p.id !== postId))
    } catch {}
  }

  const handleLike = async (postId: string) => {
  try {
    const res = await api.post(`/likes/${postId}`)
    setPosts(posts.map(p =>
      p.id === postId
        ? { ...p, liked: res.data.liked, like_count: res.data.liked ? p.like_count + 1 : p.like_count - 1 }
        : p
    ))
  } catch {}
}

  const handleShowLiked = async (postId: string) => {
    if (showLiked[postId]) {
      setShowLiked({ ...showLiked, [postId]: false })
      return
    }
    try {
      const res = await api.get(`/likes/${postId}/users`)
      setLikedUsers({ ...likedUsers, [postId]: res.data })
      setShowLiked({ ...showLiked, [postId]: true })
    } catch {}
  }

  if (!profile) return <div className="p-6">Loading...</div>

  return (
    <div className="min-h-screen bg-white">
      {/* Top Nav */}
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-6 pt-20">
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

          {isOwnProfile ? (
            <button
              onClick={() => navigate('/settings')}
              className="bg-black text-white px-4 py-1 text-sm"
            >
              Edit Profile
            </button>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Posts */}
        {posts.map((post) => (
          <div key={post.id} className="border p-4 mb-4">
            <p className="text-sm mb-2">{post.text_content}</p>
            {post.image_url && (
              <img src={post.image_url} alt="" className="w-full border mb-2" />
            )}
            <div className="flex items-center gap-3 mt-2">
              <button
  onClick={() => handleLike(post.id)}
  className={`text-sm px-3 py-1 border ${post.liked ? 'bg-black text-white' : 'bg-white text-black'}`}
>
  ♥ {post.like_count}
</button>
              {isOwnProfile && post.like_count > 0 && (
                <button
                  onClick={() => handleShowLiked(post.id)}
                  className="text-xs underline text-gray-500"
                >
                  {showLiked[post.id] ? 'Hide' : 'See who liked'}
                </button>
              )}
              {isOwnProfile && (
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="text-red-500 text-xs ml-auto"
                >
                  Delete post
                </button>
              )}
            </div>
            {isOwnProfile && showLiked[post.id] && likedUsers[post.id] && (
              <div className="mt-2 border-t pt-2">
                {likedUsers[post.id].map(u => (
                  <div key={u.user_id} className="flex items-center gap-2 py-1">
                    <div className="w-6 h-6 bg-gray-200 rounded-full overflow-hidden">
                      {u.profile_picture_url && (
                        <img src={u.profile_picture_url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <Link to={`/profile/${u.user_id}`} className="text-sm underline">
                      {u.full_name}
                    </Link>
                  </div>
                ))}
              </div>
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