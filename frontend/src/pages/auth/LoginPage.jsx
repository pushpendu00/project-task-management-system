import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { AiOutlineGithub, AiOutlineLinkedin, AiOutlineTwitter, AiOutlineCloseCircle } from 'react-icons/ai'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import useAuth from '../../hooks/useAuth'

const LoginPage = () => {
  const { login, loading } = useAuth()
  const [form, setForm]    = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [adminContact, setAdminContact] = useState(null)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: '' }))
    setSubmitError('')
    setAdminContact(null)
  }

  const validate = () => {
    const newErrors = {}
    if (!form.email)    newErrors.email    = 'Email is required'
    if (!form.password) newErrors.password = 'Password is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    setAdminContact(null)
    if (!validate()) return
    try {
      await login(form)
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
        setSubmitError(err.response.data?.message || 'Login failed. Please try again.')
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
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Sign In</h1>
            <p className="text-slate-400 mt-2 text-sm">Welcome back! Sign in to your workspace</p>
          </div>
          
          <form onSubmit={handleSubmit} id="login-form" className="space-y-5">
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
            <Input id="login-email"    label="Email Address" name="email"    type="email"    value={form.email}    onChange={handleChange} placeholder="you@example.com" error={errors.email}    />
            <Input id="login-password" label="Password"      name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••"         error={errors.password} />
            <Button type="submit" variant="primary" loading={loading} className="w-full justify-center" id="login-submit-btn">
              Sign In
            </Button>
          </form>
          
          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">Sign up</Link>
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

export default LoginPage
