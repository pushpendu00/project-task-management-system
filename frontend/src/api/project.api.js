import api from './axios'

export const getProjectsApi    = ()           => api.get('/projects')
export const getProjectByIdApi = (id)         => api.get(`/projects/${id}`)
export const createProjectApi  = (data)       => api.post('/projects', data)
export const updateProjectApi  = (id, data)   => api.put(`/projects/${id}`, data)
export const deleteProjectApi  = (id)         => api.delete(`/projects/${id}`)
export const addMemberApi      = (id, data)   => api.post(`/projects/${id}/members`, data)
export const removeMemberApi   = (id, userId) => api.delete(`/projects/${id}/members/${userId}`)
