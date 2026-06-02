import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

function CompleteProfile() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [course, setCourse] = useState('')
  const [courseStartYear, setCourseStartYear] = useState('')
  const [country, setCountry] = useState('')
  const [sex, setSex] = useState('')
  const [relationshipStatus, setRelationshipStatus] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    try {
      await api.post('/users/complete-profile', {
        full_name: fullName,
        course,
        course_start_year: parseInt(courseStartYear),
        country,
        sex,
        relationship_status: relationshipStatus,
      })
      navigate('/home')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save profile')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b px-6 py-4">
        <span className="text-2xl font-bold">UniPulse</span>
      </div>

      <div className="max-w-sm mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold mb-2">Complete Your Profile</h1>
        <p className="text-sm text-gray-600 mb-6">This is required before you can use UniPulse.</p>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <div className="mb-4">
          <label className="block mb-1 text-sm">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border px-3 py-2 text-sm"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-sm">Course Name</label>
          <input
            type="text"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            className="w-full border px-3 py-2 text-sm"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-sm">Course Start Year</label>
          <input
            type="number"
            value={courseStartYear}
            onChange={(e) => setCourseStartYear(e.target.value)}
            className="w-full border px-3 py-2 text-sm"
            placeholder="e.g. 2023"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-sm">Country</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full border px-3 py-2 text-sm"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-sm">Sex</label>
          <select
            value={sex}
            onChange={(e) => setSex(e.target.value)}
            className="w-full border px-3 py-2 text-sm"
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block mb-1 text-sm">Relationship Status</label>
          <select
            value={relationshipStatus}
            onChange={(e) => setRelationshipStatus(e.target.value)}
            className="w-full border px-3 py-2 text-sm"
          >
            <option value="">Select</option>
            <option value="single">Single</option>
            <option value="taken">Taken</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-black text-white py-2 text-sm font-medium"
        >
          Save and Continue
        </button>
      </div>
    </div>
  )
}

export default CompleteProfile