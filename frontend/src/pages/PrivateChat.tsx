import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'
import api from '../utils/api'
import { getToken } from '../utils/auth'

interface Message {
  id: number
  sender_id: number
  text: string
  created_at: string
}

function PrivateChat() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [otherName, setOtherName] = useState('')
  const socketRef = useRef<Socket | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    fetchMessages()
    fetchOtherUser()

    const socket = io('http://localhost:8000', {
      auth: { token: getToken() }
    })
    socketRef.current = socket

    socket.on('private_message', (msg: Message) => {
      if (String(msg.sender_id) === String(id)) {
        setMessages((prev) => [...prev, msg])
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/chat/private/${id}`)
      setMessages(res.data)
    } catch {
      navigate('/login')
    }
  }

  const fetchOtherUser = async () => {
    try {
      const res = await api.get(`/users/${id}`)
      setOtherName(res.data.full_name)
    } catch {}
  }

  const handleSend = () => {
    if (!text.trim()) return
    socketRef.current?.emit('private_message', { to_user_id: id, text })
    setText('')
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend()
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
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

      <div className="max-w-2xl mx-auto w-full px-4 py-4 flex-1 overflow-y-auto pb-32">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => navigate('/messages')} className="text-sm underline">← Back</button>
          <h1 className="text-xl font-bold">{otherName}</h1>
        </div>

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`border p-3 mb-2 max-w-xs ${
              String(msg.sender_id) !== String(id) ? 'ml-auto' : ''
            }`}
          >
            <p className="text-sm">{msg.text}</p>
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