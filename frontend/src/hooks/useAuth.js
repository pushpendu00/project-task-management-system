import { useRecoilState, useRecoilValue } from 'recoil'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authUserAtom, authTokenAtom, authLoadingAtom } from '../recoil/atoms/authAtom'
import { isAuthenticatedSelector } from '../recoil/selectors/authSelectors'
import { loginApi, registerApi, getMeApi, logoutApi } from '../api/auth.api'

const useAuth = () => {
  const [user,    setUser]    = useRecoilState(authUserAtom)
  const [token,   setToken]   = useRecoilState(authTokenAtom)
  const [loading, setLoading] = useRecoilState(authLoadingAtom)
  const isAuthenticated       = useRecoilValue(isAuthenticatedSelector)
  const navigate              = useNavigate()

  const login = async (credentials) => {
    try {
      setLoading(true)
      const { data } = await loginApi(credentials)
      localStorage.setItem('token', data.token)
      setToken(data.token)
      setUser(data.user)
      toast.success(`Welcome back, ${data.user.name}!`)
      navigate('/dashboard')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    try {
      setLoading(true)
      const { data } = await registerApi(userData)
      localStorage.setItem('token', data.token)
      setToken(data.token)
      setUser(data.user)
      toast.success('Account created successfully!')
      navigate('/dashboard')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const fetchMe = async () => {
    try {
      setLoading(true)
      const { data } = await getMeApi()
      setUser(data.user)
    } catch (_) {
      logout()
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try { await logoutApi() } catch (_) {}
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    navigate('/login')
    toast.success('Logged out successfully')
  }

  return { user, token, loading, isAuthenticated, login, register, logout, fetchMe }
}

export default useAuth
