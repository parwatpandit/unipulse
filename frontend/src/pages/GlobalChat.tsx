import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'
import api from '../utils/api'
import { getToken } from '../utils/auth'

interface Message {
  id: number
  user_id: number
  full_name: string
  text: string
  created_at: string
}

function GlobalChat() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const socketRef = useRef<Socket | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    fetchMessages()

    const socket = io('http://localhost:8000', {
      auth: { token: getToken() }
    })
    socketRef.current = socket

    socket.on('global_message', (msg: Message) => {
      setMessages((prev) => [...prev, msg])
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const res = await api.get('/chat/global')
      setMessages(res.data)
    } catch {
      navigate('/login')
    }
  }

  const handleSend = () => {
    if (!text.trim()) return
    socketRef.current?.emit('global_message', { text })
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
        <h1 className="text-xl font-bold mb-4">Global Chat</h1>

        {messages.map((msg) => (
          <div key={msg.id} className="border p-3 mb-2">
            <p className="text-xs text-gray-500 mb-1">
              <Link to={`/profile/${msg.user_id}`} className="underline">{msg.full_name}</Link>
            </p>
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

export default GlobalChat