import { useRecoilState, useRecoilValue } from 'recoil'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authUserAtom, authTokenAtom, authLoadingAtom, authCheckedAtom } from '../recoil/atoms/authAtom'
import { isAuthenticatedSelector } from '../recoil/selectors/authSelectors'
import { loginApi, registerApi, getMeApi, logoutApi } from '../api/auth.api'

const useAuth = () => {
  const [user, setUser] = useRecoilState(authUserAtom)
  const [token, setToken] = useRecoilState(authTokenAtom)
  const [loading, setLoading] = useRecoilState(authLoadingAtom)
  const [authChecked, setAuthChecked] = useRecoilState(authCheckedAtom)
  const isAuthenticated = useRecoilValue(isAuthenticatedSelector)
  const navigate = useNavigate()

  const login = async (credentials) => {
    try {
      setLoading(true)
      const { data } = await loginApi(credentials)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setToken(data.token)
      setUser(data.user)
      setAuthChecked(true)
      toast.success(`Welcome back, ${data.user.name}!`)
      navigate('/dashboard')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    try {
      setLoading(true)
      const { data } = await registerApi(userData)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setToken(data.token)
      setUser(data.user)
      setAuthChecked(true)
      toast.success('Account created successfully!')
      navigate('/dashboard')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const fetchMe = async () => {
    try {
      setLoading(true)
      const { data } = await getMeApi()
      setUser(data.user)
      localStorage.setItem('user', JSON.stringify(data.user))
      setAuthChecked(true)
    } catch (_) {
      logout()
      setAuthChecked(true)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try { await logoutApi() } catch (_) { }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    setAuthChecked(true)
    navigate('/login')
    toast.success('Logged out successfully')
  }

  return { user, token, loading, isAuthenticated, authChecked, login, register, logout, fetchMe }
}

export default useAuth
