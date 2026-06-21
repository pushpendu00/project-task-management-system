import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import useAuth from '../../hooks/useAuth'

const RegisterPage = () => {
  const { register, loading } = useAuth()
  const [form, setForm]       = useState({ name: '', email: '', password: '', role: 'member' })
  const [errors, setErrors]   = useState({})

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: '' }))
  }

  const validate = () => {
    const newErrors = {}
    if (!form.name.trim())        newErrors.name     = 'Name is required'
    if (!form.email)              newErrors.email    = 'Email is required'
    if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) register(form)
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-dark-900 to-dark-950 pointer-events-none" />
      <div className="relative w-full max-w-md animate-slide-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            <span className="text-primary-400">Task</span>Flow
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Create your account</p>
        </div>
        <div className="card p-8">
          <form onSubmit={handleSubmit} id="register-form" className="space-y-5">
            <Input id="register-name"     label="Full Name"      name="name"     value={form.name}     onChange={handleChange} placeholder="John Doe"          error={errors.name}     />
            <Input id="register-email"    label="Email Address"  name="email"    type="email"    value={form.email}    onChange={handleChange} placeholder="you@example.com" error={errors.email}    />
            <Input id="register-password" label="Password"       name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min. 6 characters" error={errors.password} />
            <div>
              <label className="label">Role</label>
              <select name="role" value={form.role} onChange={handleChange} className="input" id="register-role">
                <option value="member">Member</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <Button type="submit" variant="primary" loading={loading} className="w-full justify-center" id="register-submit-btn">
              Create Account
            </Button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
