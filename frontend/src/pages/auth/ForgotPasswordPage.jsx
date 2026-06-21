import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import api from '../../api/axios'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      toast.error('Please provide your email address')
      return
    }

    try {
      setLoading(true)
      await api.post('/auth/forgot-password', { email })
      setSubmitted(true)
      toast.success('Reset link sent to your email!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request reset')
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
          <p className="text-slate-400 mt-2 text-sm">Recover your password</p>
        </div>
        <div className="card p-8">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-5" id="forgot-password-form">
              <p className="text-slate-300 text-sm">
                Enter your email address and we'll log a password reset link to notifications.log and send it to you.
              </p>
              <Input
                id="forgot-email"
                label="Email Address"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
              <Button type="submit" variant="primary" loading={loading} className="w-full justify-center" id="forgot-submit-btn">
                Send Reset Link
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-green-400 text-lg font-semibold">Reset Link Sent</div>
              <p className="text-slate-400 text-sm">
                A password reset URL was generated and logged. Please check <code className="text-primary-300">backend/logs/notifications.log</code>.
              </p>
            </div>
          )}
          <p className="text-center text-sm text-slate-500 mt-6">
            Remembered your password?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
