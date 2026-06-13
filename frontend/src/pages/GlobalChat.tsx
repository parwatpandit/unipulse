import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'
import { getToken, getCurrentUserId } from '../utils/auth'
import Navbar from '../components/Navbar'

interface Message {
  user_id: string
  email: string
  message: string
  course: string
  created_at: string
}

const ADJECTIVES = ['Silent', 'Crazy', 'Wild', 'Angry', 'Lazy', 'Sneaky', 'Brave', 'Grumpy', 'Fluffy', 'Spicy',
  'Tiny', 'Giant', 'Sleepy', 'Bouncy', 'Dizzy', 'Fuzzy', 'Cheeky', 'Clumsy', 'Funky', 'Goofy',
  'Happy', 'Hyper', 'Icy', 'Jolly', 'Jumpy', 'Lucky', 'Mighty', 'Nerdy', 'Odd', 'Peppy',
  'Quirky', 'Rapid', 'Rowdy', 'Rusty', 'Sassy', 'Shiny', 'Silly', 'Slimy', 'Smelly', 'Stormy',
  'Strange', 'Stubby', 'Stumpy', 'Sunny', 'Swift', 'Tangy', 'Tipsy', 'Wacky', 'Zany', 'Wobbly']

const NOUNS = ['Penguin', 'Noodle', 'Potato', 'Dragon', 'Muffin', 'Pickle', 'Waffle', 'Banana', 'Cactus', 'Donut',
  'Burrito', 'Churro', 'Dumpling', 'Pretzel', 'Taco', 'Biscuit', 'Brownie', 'Cabbage', 'Carrot', 'Cheese',
  'Chicken', 'Cookie', 'Crumpet', 'Cucumber', 'Custard', 'Eggplant', 'Garlic', 'Gummy', 'Hotdog', 'Jellyfish',
  'Kiwi', 'Lemon', 'Lettuce', 'Lizard', 'Llama', 'Lobster', 'Mango', 'Melon', 'Monkey', 'Mushroom',
  'Nacho', 'Narwhal', 'Octopus', 'Onion', 'Pancake', 'Parrot', 'Peanut', 'Pigeon', 'Pineapple', 'Platypus']

function getAnonName(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  const adj = ADJECTIVES[Math.abs(hash) % ADJECTIVES.length]
  const noun = NOUNS[Math.abs(hash >> 4) % NOUNS.length]
  return `${adj} ${noun}`
}

function GlobalChat() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const socketRef = useRef<Socket | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const myId = getCurrentUserId()

  useEffect(() => {
    const token = getToken()
    if (!token) return navigate('/login')

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:8000', { auth: { token } })
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

    return () => { socket.disconnect() }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView()
  }, [messages])

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
      <Navbar />
      <div className="max-w-2xl mx-auto w-full px-4 flex-1 pb-32 pt-20">
        <h1 className="text-xl font-bold py-4">Global Chat</h1>
        {messages.map((msg, i) => {
          const isMe = msg.user_id === myId
          const prevMsg = messages[i - 1]
          const showHeader = !prevMsg || prevMsg.user_id !== msg.user_id
          const name = getAnonName(msg.user_id)

          return (
            <div key={i} className={`mb-1 flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className="flex flex-col" style={{ maxWidth: '70%' }}>
                {showHeader && (
                  <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-500" fill="currentColor">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                      </svg>
                    </div>
                    <div className={isMe ? 'text-right' : ''}>
                      <p className="text-xs font-semibold">{isMe ? 'You' : name}</p>
                      {msg.course && <p className="text-xs text-gray-400">{msg.course}</p>}
                    </div>
                  </div>
                )}
                <div className={`px-3 py-2 text-sm rounded-sm ${isMe ? 'bg-black text-white mr-10' : 'border ml-10'}`}>
                  <p>{msg.message}</p>
                  <p className={`text-xs mt-1 ${isMe ? 'text-gray-300' : 'text-gray-400'}`}>
                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
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
        <button onClick={handleSend} className="bg-black text-white px-4 py-2 text-sm">Send</button>
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