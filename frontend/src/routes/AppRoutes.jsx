import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useRecoilValue } from 'recoil'
import { authTokenAtom } from '../recoil/atoms/authAtom'
import PrivateRoute      from './PrivateRoute'
import LoginPage         from '../pages/auth/LoginPage'
import RegisterPage      from '../pages/auth/RegisterPage'
import DashboardPage     from '../pages/dashboard/DashboardPage'
import ProjectsPage      from '../pages/projects/ProjectsPage'
import ProjectDetailPage from '../pages/projects/ProjectDetailPage'
import TasksPage         from '../pages/tasks/TasksPage'
import useAuth from '../hooks/useAuth'

const AppRoutes = () => {
  const token      = useRecoilValue(authTokenAtom)
  const { fetchMe } = useAuth()

  // Rehydrate user on page refresh if token is present
  useEffect(() => { if (token) fetchMe() }, []) // eslint-disable-line

  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<LoginPage />}    />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected */}
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard"    element={<DashboardPage />}     />
        <Route path="/projects"     element={<ProjectsPage />}      />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/tasks"        element={<TasksPage />}         />
      </Route>

      {/* Fallback */}
      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default AppRoutes
