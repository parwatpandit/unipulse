import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'

interface Notification {
  id: string
  type: string
  from_user_id: string
  from_user_name: string
  is_read: boolean
  created_at: string
}

function Notifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data)
    } catch {
      navigate('/login')
    }
  }

  const markRead = async (id: string) => {
    try {
      await api.post(`/notifications/read/${id}`)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch {}
  }

  const handleAccept = async (notificationId: string, fromUserId: string) => {
    try {
      const res = await api.get(`/friends/status/${fromUserId}`)
      const requestId = res.data.request_id
      await api.post(`/friends/accept/${requestId}`)
      markRead(notificationId)
      fetchNotifications()
    } catch {}
  }

  const handleDecline = async (notificationId: string, fromUserId: string) => {
    try {
      const res = await api.get(`/friends/status/${fromUserId}`)
      const requestId = res.data.request_id
      await api.post(`/friends/decline/${requestId}`)
      markRead(notificationId)
      fetchNotifications()
    } catch {}
  }

  const getMessage = (type: string, name: string) => {
    if (type === 'friend_request') return `${name} sent you a friend request`
    if (type === 'friend_accepted') return `${name} accepted your friend request`
    if (type === 'message') return `${name} sent you a message`
    return type
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

      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold mb-4">Notifications</h1>

        {notifications.length === 0 && (
          <p className="text-sm text-gray-500">No notifications yet.</p>
        )}

        {notifications.map((n) => (
          <div
            key={n.id}
            className={`border p-3 mb-3 ${!n.is_read ? 'bg-gray-50' : ''}`}
          >
            <p className="text-sm">{getMessage(n.type, n.from_user_name)}</p>
            {n.type === 'friend_request' && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleAccept(n.id, n.from_user_id)}
                  className="bg-black text-white px-3 py-1 text-xs"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleDecline(n.id, n.from_user_id)}
                  className="border px-3 py-1 text-xs"
                >
                  Decline
                </button>
              </div>
            )}
            {!n.is_read && n.type !== 'friend_request' && (
              <p className="text-xs text-gray-400 mt-1 cursor-pointer" onClick={() => markRead(n.id)}>
                Click to mark as read
              </p>
            )}
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

export default Notifications