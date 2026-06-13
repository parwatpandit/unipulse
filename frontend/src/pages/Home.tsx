import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'
import Navbar from '../components/Navbar'

interface Post {
  id: string
  user_id: string
  full_name: string
  course: string
  profile_picture_url: string | null
  text_content: string
  image_url: string | null
  created_at: string
  like_count: number
  liked: boolean
}

function Home() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingMore, setLoadingMore] = useState(false)

  const skipRef = useRef(0)
  const hasMoreRef = useRef(true)
  const loadingMoreRef = useRef(false)

  useEffect(() => {
    fetchPosts()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const nearBottom = window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 200
      if (nearBottom && hasMoreRef.current && !loadingMoreRef.current) {
        loadMore()
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const fetchPosts = async () => {
    try {
      const res = await api.get('/posts?skip=0&limit=25')
      setPosts(res.data)
      skipRef.current = res.data.length
      hasMoreRef.current = res.data.length === 25
    } catch {
      navigate('/login')
    }
  }

  const loadMore = async () => {
    loadingMoreRef.current = true
    setLoadingMore(true)
    try {
      const res = await api.get(`/posts?skip=${skipRef.current}&limit=25`)
      setPosts(prev => [...prev, ...res.data])
      skipRef.current += res.data.length
      hasMoreRef.current = res.data.length === 25
    } catch {}
    loadingMoreRef.current = false
    setLoadingMore(false)
  }

  const handleLike = async (postId: string) => {
    try {
      const res = await api.post(`/likes/${postId}`)
      setPosts(posts.map(p =>
        p.id === postId
          ? { ...p, liked: res.data.liked, like_count: res.data.like_count }
          : p
      ))
    } catch {}
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Nav */}
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-6 pt-20">

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
              <img src={post.image_url} alt="" className="w-full border mb-2" />
            )}
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => handleLike(post.id)}
                className={`text-sm px-3 py-1 border ${post.liked ? 'bg-black text-white' : 'bg-white text-black'}`}
              >
                ♥ {post.like_count}
              </button>
            </div>
          </div>
        ))}

        {loadingMore && (
          <p className="text-center text-sm text-gray-400 py-4">Loading more...</p>
        )}
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