import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'

interface Post {
  id: number
  user_id: number
  full_name: string
  course: string
  profile_picture_url: string | null
  text_content: string
  image_url: string | null
  created_at: string
}

function Home() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
  const [text, setText] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const res = await api.get('/posts')
      setPosts(res.data)
    } catch {
      navigate('/login')
    }
  }

  const handlePost = async () => {
    if (!text.trim()) return
    setError('')
    try {
      const formData = new FormData()
      formData.append('text_content', text)
      if (image) formData.append('image', image)
      await api.post('/posts', formData)
      setText('')
      setImage(null)
      fetchPosts()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to post')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Nav */}
      <div className="border-b px-6 py-3 flex items-center justify-between sticky top-0 bg-white z-50">
      {/* <Link to="/home" className="text-xl font-bold">UniPulse</Link> */}
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
        {/* Create Post */}
        <div className="border p-4 mb-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full border px-3 py-2 text-sm mb-2 resize-none"
            rows={3}
          />
          <div className="flex items-center justify-between">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="text-sm"
            />
            <button
              onClick={handlePost}
              className="bg-black text-white px-4 py-1 text-sm"
            >
              Post
            </button>
          </div>
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>

        {/* Posts Feed */}
        {posts.map((post) => (
          <div key={post.id} className="border p-4 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden">
                {post.profile_picture_url && (
                  <img src={post.profile_picture_url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div>
                <Link to={`/profile/${post.user_id}`} className="text-sm font-medium underline">
                  {post.full_name}
                </Link>
                <p className="text-xs text-gray-500">{post.course}</p>
              </div>
            </div>
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

export default Home