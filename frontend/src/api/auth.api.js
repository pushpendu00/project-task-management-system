import api from './axios'

export const loginApi    = (credentials) => api.post('/auth/login', credentials)
export const registerApi = (userData)    => api.post('/auth/register', userData)
export const getMeApi    = ()            => api.get('/auth/me')
export const logoutApi   = ()            => api.post('/auth/logout')
