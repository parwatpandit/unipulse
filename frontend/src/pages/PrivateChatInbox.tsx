import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'

interface Conversation {
  user_id: number
  full_name: string
  profile_picture_url: string | null
  last_message: string
  created_at: string
}

function PrivateChatInbox() {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<Conversation[]>([])

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const res = await api.get('/chat/conversations')
      setConversations(res.data)
    } catch {
      navigate('/login')
    }
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
        <h1 className="text-xl font-bold mb-4">Messages</h1>

        {conversations.length === 0 && (
          <p className="text-sm text-gray-500">No conversations yet.</p>
        )}

        {conversations.map((c) => (
          <div
            key={c.user_id}
            className="border p-3 mb-3 flex items-center gap-3 cursor-pointer"
            onClick={() => navigate(`/messages/${c.user_id}`)}
          >
            <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
              {c.profile_picture_url && (
                <img src={c.profile_picture_url} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{c.full_name}</p>
              <p className="text-xs text-gray-500 truncate">{c.last_message}</p>
            </div>
          </div>
        ))}
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

export default PrivateChatInbox