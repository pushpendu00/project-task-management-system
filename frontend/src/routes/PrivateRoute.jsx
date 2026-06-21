import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useRecoilValue } from 'recoil'
import { isAuthenticatedSelector } from '../recoil/selectors/authSelectors'
import Layout from '../components/layout/Layout'

const PrivateRoute = () => {
  const isAuthenticated = useRecoilValue(isAuthenticatedSelector)
  return isAuthenticated
    ? <Layout><Outlet /></Layout>
    : <Navigate to="/login" replace />
}

export default PrivateRoute
