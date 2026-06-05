import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'

function CreatePost() {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [error, setError] = useState('')

  const handlePost = async () => {
    if (!text.trim()) return
    setError('')
    try {
      const formData = new FormData()
      formData.append('text_content', text)
      if (image) formData.append('image', image)
      await api.post('/posts', formData)
      navigate('/home')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to post')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b px-6 py-3 flex items-center justify-between fixed top-0 left-0 right-0 bg-white z-50">
        <span className="text-xl font-bold cursor-pointer" onClick={() => { window.location.href = '/home' }}>UniPulse</span>
        <input
          type="text"
          placeholder="Search students or courses..."
          onFocus={() => navigate('/search')}
          className="border px-3 py-1 text-sm w-64"
          readOnly
        />
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/create-post')} className="bg-black text-white px-3 py-1 text-sm">Post</button>
          <Link to="/notifications" className="text-sm">🔔</Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pt-20">
        <h1 className="text-xl font-bold mb-4">Create Post</h1>

        <div className="border p-4 mb-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full border px-3 py-2 text-sm mb-3 resize-none"
            rows={5}
            autoFocus
          />
          <div className="mb-3">
            <label className="block text-sm mb-1">Add an image (optional)</label>
            <label className="cursor-pointer border px-4 py-2 text-sm inline-block">
  {image ? image.name : 'Choose Image'}
  <input
    type="file"
    accept="image/*"
    onChange={(e) => setImage(e.target.files?.[0] || null)}
    className="hidden"
  />
</label>
          </div>
          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={handlePost}
              className="bg-black text-white px-6 py-2 text-sm"
            >
              Post
            </button>
            <button
              onClick={() => navigate('/home')}
              className="border px-6 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
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

export default CreatePost