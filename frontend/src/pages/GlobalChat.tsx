import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'
import { getToken } from '../utils/auth'

interface Message {
  user_id: string
  email: string
  message: string
}

function GlobalChat() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) return navigate('/login')

    const socket = io('http://localhost:8000', {
      auth: { token }
    })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('get_global_history')
    })

    socket.on('global_history', (history: Message[]) => {
      setMessages(history)
    })

    socket.on('global_message', (msg: Message) => {
      setMessages((prev) => [...prev, msg])
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const handleSend = () => {
    if (!text.trim()) return
    socketRef.current?.emit('send_global_message', { message: text })
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

      <div className="max-w-2xl mx-auto w-full px-4 py-4 flex-1 pb-32">
        <h1 className="text-xl font-bold mb-4">Global Chat</h1>

        {messages.map((msg, i) => (
          <div key={i} className="border p-3 mb-2">
            <p className="text-xs text-gray-500 mb-1">{msg.email}</p>
            <p className="text-sm">{msg.message}</p>
          </div>
        ))}
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