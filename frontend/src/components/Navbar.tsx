import { useNavigate, Link } from 'react-router-dom'

function Navbar() {
  const navigate = useNavigate()

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
        <Link to="/notifications" className="text-sm">🔔</Link>
      </div>
    </div>
  )
}

export default Navbar