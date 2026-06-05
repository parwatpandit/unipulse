import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'
import { getToken } from '../utils/auth'
import api from '../utils/api'

interface Message {
  sender_id: string
  receiver_id: string
  message: string
  created_at: string
}

function PrivateChat() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [otherName, setOtherName] = useState('')
  const socketRef = useRef<Socket | null>(null)
  const [myId, setMyId] = useState('')
  const [profile, setProfile] = useState<{ profile_picture_url: string | null } | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) return navigate('/login')

    fetchOtherUser()
    fetchMyId()

    const socket = io('http://localhost:8000', {
      auth: { token }
    })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('join_private_room', { other_user_id: id })
      socket.emit('get_private_history', { other_user_id: id })
    })

    socket.on('private_history', (history: Message[]) => {
      setMessages(history)
    })

    socket.on('private_message', (msg: Message) => {
      setMessages((prev) => [...prev, msg])
    })

    return () => {
      socket.disconnect()
    }
  }, [id])

  useEffect(() => {
  bottomRef.current?.scrollIntoView()
}, [messages])

  const fetchOtherUser = async () => {
  try {
    const res = await api.get(`/users/${id}`)
    setOtherName(res.data.full_name)
    setProfile(res.data)
  } catch {}
}

  const fetchMyId = async () => {
    try {
      const res = await api.get('/users/me')
      setMyId(String(res.data.id))
    } catch {}
  }

  const handleSend = () => {
    if (!text.trim()) return
    socketRef.current?.emit('send_private_message', { receiver_id: id, message: text })
    setText('')
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend()
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="border-b px-6 py-3 flex items-center justify-between fixed top-0 left-0 right-0 bg-white z-50">

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

      <div className="fixed top-14 left-0 right-0 px-4 py-2 z-40 pointer-events-none">
  <div className="flex items-center gap-3 mb-1 pointer-events-auto">
    <div className="w-9 h-9 bg-gray-200 rounded-full overflow-hidden shadow">
      {profile?.profile_picture_url && (
        <img src={profile.profile_picture_url} alt="" className="w-full h-full object-cover" />
      )}
    </div>
    <h1 className="text-base font-bold drop-shadow">{otherName}</h1>
  </div>
  <button onClick={() => navigate('/messages')} className="text-xs text-gray-500 underline pointer-events-auto drop-shadow">← Back</button>
</div>
<div className="max-w-2xl mx-auto w-full px-4 py-4 flex-1 pb-32 pt-36">

        {messages.map((msg, i) => (
          <div
  key={i}
  className={`border p-3 mb-2 max-w-xs ${
    msg.sender_id === myId ? 'ml-auto mr-2' : 'ml-2'
  }`}
>
            <p className="text-sm">{msg.message}</p>
<p className="text-xs text-gray-400 mt-1">
  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="fixed bottom-12 left-0 right-0 border-t bg-white px-4 py-2 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message..."
          className="flex-1 border px-3 py-2 text-sm"
        />
        <button
          onClick={handleSend}
          className="bg-black text-white px-4 py-2 text-sm"
        >
          Send
        </button>
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

export default PrivateChat