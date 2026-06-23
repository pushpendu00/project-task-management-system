import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import {
  AiOutlineUser, AiOutlineMail, AiOutlineCalendar, AiOutlineSafety,
  AiOutlinePhone, AiOutlineHome, AiOutlineCamera, AiOutlineLock,
  AiOutlineEdit, AiOutlineClose, AiOutlineCheck
} from 'react-icons/ai'
import { authUserAtom } from '../../recoil/atoms/authAtom'
import api from '../../api/axios'
import { formatDate } from '../../utils/formatDate'
import toast from 'react-hot-toast'
import Button from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'
import Select from '../../components/common/Select'
import { getInitials } from '../../utils/getInitials'

const getAvatarUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  const host = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase
  return `${host}${path}`
}

const COUNTRIES = [
  { name: 'India', code: '+91' },
  { name: 'United States', code: '+1' },
  { name: 'United Kingdom', code: '+44' },
  { name: 'Australia', code: '+61' },
  { name: 'Japan', code: '+81' },
  { name: 'Germany', code: '+49' },
  { name: 'France', code: '+33' },
  { name: 'Singapore', code: '+65' },
  { name: 'United Arab Emirates', code: '+971' },
  { name: 'Brazil', code: '+55' },
  { name: 'China', code: '+86' },
  { name: 'Russia', code: '+7' },
  { name: 'South Korea', code: '+82' },
  { name: 'South Africa', code: '+27' },
  { name: 'New Zealand', code: '+64' }
]

const COUNTRY_CODES = COUNTRIES.map((c) => c.code)

const parsePhone = (rawPhone) => {
  if (!rawPhone) return { code: '+91', number: '' }
  const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.length - a.length)
  for (const code of sortedCodes) {
    if (rawPhone.startsWith(code)) {
      const number = rawPhone.slice(code.length).trim()
      return { code, number }
    }
  }
  return { code: '+91', number: rawPhone }
}

const ProfilePage = () => {
  const [user, setUser] = useRecoilState(authUserAtom)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  // Cropping State
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState('')
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const canvasRef = useRef(null)
  const imageRef = useRef(null)

  const [phoneCountry, setPhoneCountry] = useState('+91')
  const [phoneNumber, setPhoneNumber] = useState('')

  // Country Code Dropdown State
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const countryDropdownRef = useRef(null)

  // Handle click outside country dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setCountryDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    gender: user?.gender || '',
    avatar: user?.avatar || '',
  })

  // Keep form data in sync with recoil user
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        gender: user.gender || '',
        avatar: user.avatar || '',
      })
      const parsed = parsePhone(user.phone)
      setPhoneCountry(parsed.code)
      setPhoneNumber(parsed.number)
    }
  }, [user])

  // Load crop image
  useEffect(() => {
    if (cropImageSrc) {
      const img = new Image()
      img.src = cropImageSrc
      img.onload = () => {
        imageRef.current = img
        drawCanvas()
      }
    }
  }, [cropImageSrc])

  // Redraw canvas when zoom or offset changes
  useEffect(() => {
    drawCanvas()
  }, [zoom, offset])

  if (!user) return null

  const drawCanvas = () => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const w = img.width
    const h = img.height
    const scale = Math.min(canvas.width / w, canvas.height / h) * zoom
    const drawW = w * scale
    const drawH = h * scale
    const drawX = (canvas.width - drawW) / 2 + offset.x
    const drawY = (canvas.height - drawH) / 2 + offset.y

    ctx.drawImage(img, drawX, drawY, drawW, drawH)
  }

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    isDragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseMove = (e) => {
    if (!isDragging.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }))
    dragStart.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseUp = () => {
    isDragging.current = false
  }

  // Touch handlers
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      isDragging.current = true
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }

  const handleTouchMove = (e) => {
    if (!isDragging.current || e.touches.length !== 1) return
    const dx = e.touches[0].clientX - dragStart.current.x
    const dy = e.touches[0].clientY - dragStart.current.y
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }))
    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setCropImageSrc(reader.result)
      setCropModalOpen(true)
      setZoom(1)
      setOffset({ x: 0, y: 0 })
    }
    reader.readAsDataURL(file)
    e.target.value = '' // clear input to allow same file selection
  }

  const handleCropSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.toBlob(async (blob) => {
      if (!blob) return

      try {
        setUploading(true)
        setCropModalOpen(false)

        const file = new File([blob], 'avatar-cropped.jpg', { type: 'image/jpeg' })
        const uploadData = new FormData()
        uploadData.append('file', file)

        const { data } = await api.post('/uploads', uploadData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })

        if (data.success) {
          const newAvatarUrl = data.file.url
          if (isEditing) {
            // Update local state during edit mode (staged)
            setFormData((prev) => ({ ...prev, avatar: newAvatarUrl }))
            toast.success('Photo cropped. Click Save Changes to apply permanently.')
          } else {
            // Edit directly in view mode
            const updateResponse = await api.put(`/users/${user._id}`, { avatar: newAvatarUrl })
            if (updateResponse.data.success) {
              setUser(updateResponse.data.user)
              localStorage.setItem('user', JSON.stringify(updateResponse.data.user))
              toast.success('Profile photo updated successfully!')
            }
          }
        } else {
          toast.error('Failed to upload cropped photo')
        }
      } catch (error) {
        console.error(error)
        toast.error('Failed to save profile photo')
      } finally {
        setUploading(false)
      }
    }, 'image/jpeg', 0.9)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      const payload = {
        ...formData,
        phone: phoneNumber.trim() ? `${phoneCountry} ${phoneNumber.trim()}` : ''
      }
      const { data } = await api.put(`/users/${user._id}`, payload)

      if (data.success) {
        setUser(data.user)
        localStorage.setItem('user', JSON.stringify(data.user))
        toast.success('Profile updated successfully!')
        setIsEditing(false)
      }
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      address: user.address || '',
      gender: user.gender || '',
      avatar: user.avatar || '',
    })
    const parsed = parsePhone(user.phone)
    setPhoneCountry(parsed.code)
    setPhoneNumber(parsed.number)
    setIsEditing(false)
  }

  const filteredCountries = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.includes(countrySearch)
  )

  const avatarPreview = formData.avatar ? getAvatarUrl(formData.avatar) : ''

  return (
    <div className="animate-fade-in space-y-6">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Breadcrumb Navigation */}
      {/* <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
        <Link to="/dashboard" className="hover:text-primary-400 transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-slate-300">Profile</span>
      </div> */}

      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <AiOutlineUser className="text-primary-400" /> User Profile
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your workspace account details and settings.</p>
        </div>
      </div>

      {isEditing ? (
        /* EDIT PROFILE MODE */
        <form onSubmit={handleSubmit} className="card p-6 border border-slate-700/50 bg-dark-800/80 backdrop-blur-md space-y-5">
          <div className="flex flex-col items-center gap-3 pb-5 border-b border-slate-700/40">
            <div
              className="relative group cursor-pointer w-24 h-24 rounded-full overflow-hidden border-2 border-primary-500/30 shadow-lg shadow-primary-500/10"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary-600 text-white font-bold text-4xl flex items-center justify-center">
                  {getInitials(formData.name)}
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <AiOutlineCamera size={20} className="text-white" />
                <span className="text-[8px] text-slate-350 font-bold uppercase mt-1">Upload</span>
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
                  <Spinner size="sm" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[10px] text-primary-400 hover:text-primary-300 font-semibold uppercase tracking-wider"
            >
              Change Profile Photo
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label flex items-center gap-1">
                Email Address <AiOutlineLock size={12} className="text-slate-500" />
              </label>
              <input
                type="email"
                value={user.email}
                className="input opacity-60 cursor-not-allowed bg-dark-900/60"
                disabled
              />
            </div>

            <div>
              <label className="label">Phone Number</label>
              <div className="flex gap-2">
                <div className="relative flex-shrink-0" ref={countryDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                    className="bg-dark-900 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-100 text-sm focus:outline-none w-48 flex items-center justify-between focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  >
                    <span className="truncate">
                      {(() => {
                        const match = COUNTRIES.find((c) => c.code === phoneCountry)
                        return match ? `${match.name} (${match.code})` : phoneCountry
                      })()}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">▼</span>
                  </button>

                  {countryDropdownOpen && (
                    <div className="absolute z-50 left-0 mt-1 w-64 bg-dark-850 border border-slate-700/60 rounded-lg shadow-xl p-2 space-y-2">
                      <input
                        type="text"
                        placeholder="Search by code or country name..."
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-dark-900 border border-slate-700 rounded text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        autoFocus
                      />
                      <div className="max-h-[160px] overflow-y-auto space-y-0.5 custom-scrollbar">
                        {filteredCountries.length > 0 ? (
                          filteredCountries.map((c) => (
                            <button
                              key={`${c.name}-${c.code}`}
                              type="button"
                              onClick={() => {
                                setPhoneCountry(c.code)
                                setCountryDropdownOpen(false)
                                setCountrySearch('')
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors flex items-center justify-between ${phoneCountry === c.code
                                  ? 'bg-primary-600/20 text-primary-400 font-medium'
                                  : 'text-slate-350 hover:bg-slate-800 hover:text-slate-100'
                                }`}
                            >
                              <span className="truncate mr-2">{c.name}</span>
                              <span className="text-slate-400 font-medium flex-shrink-0">{c.code}</span>
                            </button>
                          ))
                        ) : (
                          <div className="text-center py-2 text-xs text-slate-500">
                            No country found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="input flex-1"
                />
              </div>
            </div>

            <div>
              <Select
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full"
                buttonClassName="py-2.5 px-3 bg-dark-900 border border-slate-700 rounded-lg text-slate-200 text-xs w-full text-left"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <label className="label">Home / Office Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={2}
                placeholder="Enter your address..."
                className="input resize-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="label flex items-center gap-1">
                Workspace Role <AiOutlineLock size={12} className="text-slate-500" />
              </label>
              <input
                type="text"
                value={user.role === 'member' ? 'Employee' : user.role === 'manager' ? 'Project Manager' : 'Admin'}
                className="input opacity-60 cursor-not-allowed bg-dark-900/60"
                disabled
              />
              <p className="text-[10px] text-slate-500 mt-1">Email address and role assignments can only be changed by workspace admins.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700/40 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCancel}
              disabled={saving || uploading}
            >
              <AiOutlineClose size={14} /> Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={saving}
              disabled={uploading}
            >
              <AiOutlineCheck size={14} /> Save Changes
            </Button>
          </div>
        </form>
      ) : (
        /* VIEW PROFILE MODE */
        <div className="card p-6 border border-slate-700/50 bg-dark-800/80 backdrop-blur-md space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5 pb-6 border-b border-slate-700/40">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div
                className="relative group cursor-pointer w-20 h-20 rounded-full overflow-hidden border-2 border-primary-500/30 shadow-lg shadow-primary-500/10 flex-shrink-0"
                onClick={() => fileInputRef.current?.click()}
                title="Change profile photo directly"
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary-600 text-white font-bold text-3xl flex items-center justify-center">
                    {getInitials(user.name)}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <AiOutlineCamera size={18} className="text-white" />
                  <span className="text-[7px] text-slate-350 font-bold uppercase mt-0.5">Change</span>
                </div>
                {uploading && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
                    <Spinner size="sm" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-100">{user.name}</h2>
                <p className="text-xs text-primary-400 font-medium capitalize">
                  {user.role === 'member' ? 'Employee' : user.role === 'manager' ? 'Project Manager' : 'Admin'}
                </p>
                <p className="text-[11px] text-slate-500">Joined on {formatDate(user.createdAt)}</p>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="flex-shrink-0"
            >
              <AiOutlineEdit size={14} /> Edit Profile
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-dark-900/40 border border-slate-800/80 rounded-lg flex items-start gap-3">
              <div className="p-2 rounded bg-primary-950/55 text-primary-400">
                <AiOutlineUser size={16} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Full Name</p>
                <p className="text-xs font-semibold text-slate-200 mt-0.5">{user.name}</p>
              </div>
            </div>

            <div className="p-3 bg-dark-900/40 border border-slate-800/80 rounded-lg flex items-start gap-3">
              <div className="p-2 rounded bg-primary-950/55 text-primary-400">
                <AiOutlineMail size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Email Address</p>
                <p className="text-xs font-semibold text-slate-200 mt-0.5 truncate">{user.email}</p>
              </div>
            </div>

            <div className="p-3 bg-dark-900/40 border border-slate-800/80 rounded-lg flex items-start gap-3">
              <div className="p-2 rounded bg-primary-950/55 text-primary-400">
                <AiOutlinePhone size={16} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Phone Number</p>
                {user.phone ? (
                  <p className="text-xs font-semibold text-slate-200 mt-0.5">{user.phone}</p>
                ) : (
                  <p className="text-xs text-slate-600 italic mt-0.5">Not provided</p>
                )}
              </div>
            </div>

            <div className="p-3 bg-dark-900/40 border border-slate-800/80 rounded-lg flex items-start gap-3">
              <div className="p-2 rounded bg-primary-950/55 text-primary-400">
                <AiOutlineUser size={16} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Gender</p>
                {user.gender ? (
                  <p className="text-xs font-semibold text-slate-200 mt-0.5 capitalize">{user.gender}</p>
                ) : (
                  <p className="text-xs text-slate-600 italic mt-0.5">Not provided</p>
                )}
              </div>
            </div>

            <div className="p-3 bg-dark-900/40 border border-slate-800/80 rounded-lg flex items-start gap-3 sm:col-span-2">
              <div className="p-2 rounded bg-primary-950/55 text-primary-400">
                <AiOutlineHome size={16} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Home / Office Address</p>
                {user.address ? (
                  <p className="text-xs font-semibold text-slate-200 mt-0.5 whitespace-pre-wrap leading-relaxed">{user.address}</p>
                ) : (
                  <p className="text-xs text-slate-600 italic mt-0.5">Not provided</p>
                )}
              </div>
            </div>

            <div className="p-3 bg-dark-900/40 border border-slate-800/80 rounded-lg flex items-start gap-3 sm:col-span-2">
              <div className="p-2 rounded bg-primary-950/55 text-primary-400">
                <AiOutlineSafety size={16} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Role</p>
                <p className="text-xs font-semibold text-slate-200 mt-0.5 capitalize">
                  {user.role === 'member' ? 'Employee' : user.role === 'manager' ? 'Project Manager' : 'Admin'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Link to="/dashboard" className="btn btn-secondary text-xs">
              Back to Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* CROP / PREVIEW MODAL */}
      {cropModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-dark-850 border border-slate-700/60 rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col items-center p-5 space-y-4 text-center">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Adjust Profile Photo</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Drag to position, use the slider to zoom.</p>
            </div>

            {/* Circular Crop Mask Zone */}
            <div className="relative w-64 h-64 border border-dashed border-slate-700/60 rounded-full overflow-hidden flex items-center justify-center bg-dark-950">
              <canvas
                ref={canvasRef}
                width={256}
                height={256}
                className="w-full h-full cursor-move rounded-full"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
              />
            </div>

            {/* Zoom Slider */}
            <div className="w-full space-y-1 px-2">
              <div className="flex justify-between text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
                <span>Zoom Out</span>
                <span>Zoom In</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.02"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-1 bg-dark-900 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
            </div>

            {/* Actions */}
            <div className="w-full flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCropModalOpen(false)}
                className="flex-1 btn btn-secondary text-xs py-1.5 justify-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropSave}
                className="flex-1 btn btn-primary text-xs py-1.5 justify-center"
              >
                Apply Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfilePage
