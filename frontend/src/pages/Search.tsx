import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'

interface Result {
  id: number
  full_name: string
  course: string
  profile_picture_url: string | null
}

function Search() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (!val.trim()) return setResults([])
    try {
      const res = await api.get(`/search?query=${val}`)
      setResults(res.data)
    } catch {}
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Nav */}
      <div className="border-b px-6 py-3 flex items-center justify-between fixed top-0 left-0 right-0 bg-white z-50">
        <span className="text-xl font-bold cursor-pointer" onClick={() => { window.location.href = '/home' }}>UniPulse</span>
        <input
          type="text"
          placeholder="Search students or courses..."
          value={query}
          onChange={handleSearch}
          className="border px-3 py-1 text-sm w-64"
          autoFocus
        />
        <Link to="/notifications" className="text-sm">🔔</Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pt-20">
        {results.map((user) => (
          <div
            key={user.id}
            className="border p-3 mb-3 flex items-center gap-3 cursor-pointer"
            onClick={() => navigate(`/profile/${user.id}`)}
          >
            <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
              {user.profile_picture_url && (
                <img src={user.profile_picture_url} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">{user.full_name}</p>
              <p className="text-xs text-gray-500">{user.course}</p>
            </div>
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

export default Search