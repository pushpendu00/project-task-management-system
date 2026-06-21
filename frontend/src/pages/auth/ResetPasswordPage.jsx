import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import api from '../../api/axios'

const ResetPasswordPage = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    try {
      setLoading(true)
      await api.post(`/auth/reset-password/${token}`, { password })
      toast.success('Password reset successfully! Please sign in.')
      navigate('/login')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Token is invalid or has expired')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-dark-900 to-dark-950 pointer-events-none" />
      <div className="relative w-full max-w-md animate-slide-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            <span className="text-primary-400">Task</span>Flow
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Create a new password</p>
        </div>
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5" id="reset-password-form">
            <Input
              id="new-password"
              label="New Password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••• (Min 6 chars)"
              required
            />
            <Input
              id="confirm-password"
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Button type="submit" variant="primary" loading={loading} className="w-full justify-center" id="reset-submit-btn">
              Reset Password
            </Button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-6">
            Back to{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
