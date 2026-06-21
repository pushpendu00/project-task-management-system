import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import useAuth from '../../hooks/useAuth'

const LoginPage = () => {
  const { login, loading } = useAuth()
  const [form, setForm]    = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: '' }))
  }

  const validate = () => {
    const newErrors = {}
    if (!form.email)    newErrors.email    = 'Email is required'
    if (!form.password) newErrors.password = 'Password is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) login(form)
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-dark-900 to-dark-950 pointer-events-none" />
      <div className="relative w-full max-w-md animate-slide-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            <span className="text-primary-400">Task</span>Flow
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Sign in to your workspace</p>
        </div>
        <div className="card p-8">
          <form onSubmit={handleSubmit} id="login-form" className="space-y-5">
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
      </div>
    </div>
  )
}

export default LoginPage
