import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import CompleteProfile from './pages/CompleteProfile'
import Home from './pages/Home'
import Profile from './pages/Profile'
import Search from './pages/Search'
import GlobalChat from './pages/GlobalChat'
import PrivateChatInbox from './pages/PrivateChatInbox'
import PrivateChat from './pages/PrivateChat'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/home" element={<Home />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/search" element={<Search />} />
        <Route path="/global-chat" element={<GlobalChat />} />
        <Route path="/messages" element={<PrivateChatInbox />} />
        <Route path="/messages/:id" element={<PrivateChat />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App