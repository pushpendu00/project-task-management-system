import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  AiOutlineGithub,
  AiOutlineLinkedin,
  AiOutlineTwitter,
  AiOutlineDown,
  AiOutlineUser,
  AiOutlineTeam,
  AiOutlineSetting,
  AiOutlineCheck,
  AiOutlineCloseCircle
} from 'react-icons/ai'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import useAuth from '../../hooks/useAuth'

const ROLE_DETAILS = {
  member: {
    label: 'Member',
    description: 'Standard access to assigned tasks and projects.',
    icon: AiOutlineUser,
  },
  manager: {
    label: 'Manager',
    description: 'Create and manage projects, tasks, and teams.',
    icon: AiOutlineTeam,
  },
  admin: {
    label: 'Admin',
    description: 'Full workspace control, user roles, and settings.',
    icon: AiOutlineSetting,
  },
}

const RegisterPage = () => {
  const { register, loading } = useAuth()
  const [form, setForm]       = useState({ name: '', email: '', password: '', role: 'member' })
  const [errors, setErrors]   = useState({})
  const [submitError, setSubmitError] = useState('')
  const [adminContact, setAdminContact] = useState(null)
  
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false)
  const roleDropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target)) {
        setRoleDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: '' }))
    setSubmitError('')
    setAdminContact(null)
  }

  const handleRoleSelect = (value) => {
    setForm((prev) => ({ ...prev, role: value }))
    setRoleDropdownOpen(false)
    setSubmitError('')
    setAdminContact(null)
  }

  const validate = () => {
    const newErrors = {}
    if (!form.name.trim())        newErrors.name     = 'Name is required'
    if (!form.email)              newErrors.email    = 'Email is required'
    if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    setAdminContact(null)
    if (!validate()) return
    try {
      await register(form)
    } catch (err) {
      if (!err.response) {
        setSubmitError('Could not connect to the server. Please check your network and try again.')
      } else if (err.response.data?.deactivated) {
        setSubmitError(err.response.data.message)
        setAdminContact(err.response.data.admin)
      } else if (err.response.data?.errors) {
        const fieldErrors = {}
        err.response.data.errors.forEach((validationErr) => {
          const field = validationErr.path || validationErr.param
          if (field) {
            fieldErrors[field] = validationErr.msg
          }
        })
        setErrors(fieldErrors)
        setSubmitError('Please correct the validation errors below.')
      } else {
        setSubmitError(err.response.data?.message || 'Registration failed. Please try again.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col md:flex-row overflow-hidden">
      {/* Left Side: Corporate image and branding */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 h-screen relative bg-dark-900 overflow-hidden flex-shrink-0">
        <img
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80"
          alt="Company Culture"
          className="absolute inset-0 w-full h-full object-cover opacity-45 select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-dark-950 via-dark-950/70 to-primary-950/20" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 h-full text-white">
          <span className="text-2xl font-bold tracking-wider">
            <span className="text-primary-400">Task</span>Flow
          </span>
          
          <div className="max-w-md">
            <h2 className="text-3xl font-extrabold leading-tight mb-4 text-slate-100">
              Empower your team. <br/>
              Streamline your workflow.
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Experience the next generation of team collaboration, task tracking, and workspace analytics. Drive alignment, increase transparency, and deliver high-impact results effortlessly.
            </p>
          </div>
          
          <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
            © {new Date().getFullYear()} TaskFlow Inc. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side: Form Content */}
      <div className="w-full md:w-1/2 lg:w-2/5 h-screen overflow-y-auto bg-dark-950 flex flex-col justify-between p-6 sm:p-12 relative">
        <div className="flex items-center justify-center md:hidden mb-6 mt-4">
          <span className="text-2xl font-bold tracking-wider text-white">
            <span className="text-primary-400">Task</span>Flow
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full py-8 animate-slide-in">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Create Account</h1>
            <p className="text-slate-400 mt-2 text-sm">Join your workspace and start collaborating</p>
          </div>
          
          <form onSubmit={handleSubmit} id="register-form" className="space-y-4">
            {submitError && (
              <div className="bg-red-950/40 border border-red-900/60 text-red-200 text-xs px-4 py-3 rounded-lg flex flex-col gap-2 animate-slide-in">
                <div className="flex items-start gap-2.5">
                  <AiOutlineCloseCircle className="text-red-400 text-lg flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-semibold">Error:</span> {submitError}
                  </div>
                </div>
                {adminContact && (
                  <div className="mt-1 border-t border-red-900/40 pt-2 text-[11px] text-slate-350">
                    <p className="font-semibold text-slate-300">Admin Contact Information:</p>
                    <p className="mt-0.5">Name: <span className="text-slate-200">{adminContact.name}</span></p>
                    <p>Email: <a href={`mailto:${adminContact.email}`} className="text-primary-400 hover:underline">{adminContact.email}</a></p>
                  </div>
                )}
              </div>
            )}

            <Input id="register-name"     label="Full Name"      name="name"     value={form.name}     onChange={handleChange} placeholder="John Doe"          error={errors.name}     />
            <Input id="register-email"    label="Email Address"  name="email"    type="email"    value={form.email}    onChange={handleChange} placeholder="you@example.com" error={errors.email}    />
            <Input id="register-password" label="Password"       name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min. 6 characters" error={errors.password} />
            
            {/* Custom Role Selection Dropdown */}
            <div className="relative" ref={roleDropdownRef}>
              <label className="label text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Workspace Role
              </label>
              <button
                type="button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="input flex items-center justify-between text-left cursor-pointer w-full text-slate-200 py-3"
                id="register-role-trigger"
              >
                <div className="flex items-center gap-2.5">
                  {(() => {
                    const SelectedIcon = ROLE_DETAILS[form.role].icon
                    return <SelectedIcon className="text-primary-400 text-base" />
                  })()}
                  <span className="text-xs font-semibold text-slate-200">
                    {ROLE_DETAILS[form.role].label}
                  </span>
                </div>
                <AiOutlineDown size={12} className="text-slate-500 flex-shrink-0" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-full bg-dark-850 border border-slate-750/70 rounded-lg shadow-xl overflow-hidden z-50 animate-fade-in p-1.5 space-y-1">
                  {Object.entries(ROLE_DETAILS).map(([value, details]) => {
                    const isSelected = form.role === value
                    const Icon = details.icon
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleRoleSelect(value)}
                        className={`w-full text-left text-xs px-3 py-2 rounded-md transition-colors cursor-pointer flex items-start gap-3 border ${
                          isSelected
                            ? 'bg-primary-600/10 border-primary-500/30 text-white'
                            : 'text-slate-350 hover:text-white hover:bg-dark-700/50 border-transparent'
                        }`}
                      >
                        <div className={`mt-0.5 p-1 rounded ${isSelected ? 'bg-primary-600 text-white' : 'bg-dark-750 text-slate-400'}`}>
                          <Icon size={14} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-200">{details.label}</span>
                            {isSelected && <AiOutlineCheck className="text-primary-400" size={12} />}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-normal font-normal">{details.description}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <Button type="submit" variant="primary" loading={loading} className="w-full justify-center mt-2" id="register-submit-btn">
              Create Account
            </Button>
          </form>
          
          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
          </p>
        </div>

        {/* Footer Area */}
        <div className="border-t border-slate-800/80 pt-6 mt-auto max-w-sm mx-auto w-full text-center space-y-4">
          <div className="flex justify-center gap-4 text-xs text-slate-500 font-medium">
            <a href="#privacy" className="hover:text-slate-350 hover:underline">Privacy Policy</a>
            <span>•</span>
            <a href="#terms" className="hover:text-slate-350 hover:underline">Terms of Service</a>
            <span>•</span>
            <a href="#support" className="hover:text-slate-350 hover:underline">Support</a>
          </div>
          
          <div className="flex justify-center gap-3 text-slate-500">
            <a href="#github" className="hover:text-white transition-colors" title="GitHub">
              <AiOutlineGithub size={18} />
            </a>
            <a href="#linkedin" className="hover:text-white transition-colors" title="LinkedIn">
              <AiOutlineLinkedin size={18} />
            </a>
            <a href="#twitter" className="hover:text-white transition-colors" title="Twitter / X">
              <AiOutlineTwitter size={18} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
