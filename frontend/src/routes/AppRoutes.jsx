import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useRecoilValue } from 'recoil'
import { authTokenAtom } from '../recoil/atoms/authAtom'
import PrivateRoute      from './PrivateRoute'
import LoginPage         from '../pages/auth/LoginPage'
import RegisterPage      from '../pages/auth/RegisterPage'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '../pages/auth/ResetPasswordPage'
import DashboardPage     from '../pages/dashboard/DashboardPage'
import ProjectsPage      from '../pages/projects/ProjectsPage'
import ProjectDetailPage from '../pages/projects/ProjectDetailPage'
import TasksPage         from '../pages/tasks/TasksPage'
import UsersPage         from '../pages/users/UsersPage'
import ReportsPage       from '../pages/reports/ReportsPage'
import NotificationsPage from '../pages/notifications/NotificationsPage'
import Spinner           from '../components/common/Spinner'
import useAuth from '../hooks/useAuth'

const AppRoutes = () => {
  const token = useRecoilValue(authTokenAtom)
  const { fetchMe, authChecked, isAuthenticated } = useAuth()

  // Rehydrate user on page refresh if token is present
  useEffect(() => {
    if (token) {
      fetchMe()
    }
  }, []) // eslint-disable-line

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-slate-500 text-sm">Validating session...</p>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}    />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
      <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ResetPasswordPage />} />

      {/* Protected */}
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard"    element={<DashboardPage />}     />
        <Route path="/projects"     element={<ProjectsPage />}      />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/tasks"        element={<TasksPage />}         />
        <Route path="/users"        element={<UsersPage />}         />
        <Route path="/reports"      element={<ReportsPage />}       />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default AppRoutes
