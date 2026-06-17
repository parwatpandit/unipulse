import { useNavigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../utils/api'
import { io, Socket } from 'socket.io-client'
import { getToken } from '../utils/auth'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

let socket: Socket | null = null

function Navbar() {
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count')
      setUnreadCount(res.data.unread_count)
    } catch {}
  }

  useEffect(() => {
    fetchUnreadCount()

    const token = getToken()
    if (!token) return

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    })

    socket.on('connect', () => {
      socket?.emit('join_notification_room')
    })

    socket.on('new_notification', () => {
      setUnreadCount((prev) => prev + 1)
    })

    return () => {
      socket?.disconnect()
      socket = null
    }
  }, [])

  return (
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
        <Link to="/notifications" className="relative text-sm">
          🔔
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  )
}

export default Navbar