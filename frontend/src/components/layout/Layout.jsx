import React, { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import { useRecoilValue, useRecoilState } from 'recoil'
import { AiOutlineMenu, AiOutlineLogout, AiOutlineBell } from 'react-icons/ai'
import Sidebar from './Sidebar'
import useAuth from '../../hooks/useAuth'
import { authTokenAtom } from '../../recoil/atoms/authAtom'
import { notificationsAtom } from '../../recoil/atoms/notificationAtom'
import useNotifications from '../../hooks/useNotifications'
import api from '../../api/axios'

const Layout = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const token = useRecoilValue(authTokenAtom)
  const [notifications, setNotifications] = useRecoilState(notificationsAtom)
  const { fetchNotifications } = useNotifications()

  const unreadCount = notifications.filter(n => !n.isRead).length

  // Fetch initial list of notifications
  useEffect(() => {
    if (token && user) {
      fetchNotifications()
    }
  }, [token, user]) // eslint-disable-line

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-dark-950 text-slate-100 font-sans">
      {/* Sidebar - Desktop & Mobile overlay */}
      <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      {/* Main container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Main Header */}
        <header className="h-16 border-b border-slate-700/50 bg-dark-800/80 backdrop-blur-md flex items-center justify-between px-6 flex-shrink-0 z-10">
          {/* Left section: Hamburger & brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-700 transition-colors"
              title="Open menu"
            >
              <AiOutlineMenu size={20} />
            </button>
            <span className="text-lg font-bold text-white tracking-wider md:hidden">
              <span className="text-primary-400">Task</span>Flow
            </span>
            <span className="hidden md:inline-block text-sm font-medium text-slate-400">
              Welcome back, <strong className="text-white">{user?.name}</strong>!
            </span>
          </div>

          {/* Right section: Profile & Quick actions */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <NavLink
              to="/notifications"
              className="relative p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-700 transition-colors flex-shrink-0"
              title="Notifications"
            >
              <AiOutlineBell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary-500 rounded-full flex items-center justify-center border border-dark-800" />
              )}
            </NavLink>

            {/* User badge */}
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200">{user?.name}</span>
                <span className="text-[10px] text-slate-500 capitalize">
                  {user?.role === 'member' ? 'Employee' : user?.role === 'manager' ? 'Project Manager' : 'Admin'}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary-600 text-white font-bold text-sm flex items-center justify-center border border-primary-500/30">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            </div>

            {/* Quick Logout */}
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 transition-colors"
              title="Logout"
              id="header-logout-btn"
            >
              <AiOutlineLogout size={18} />
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0 relative animate-fade-in bg-dark-900/30">
          {children}
        </main>
      </div>

      {/* Notifications / Toast */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background:   '#1e293b',
            color:        '#f1f5f9',
            border:       '1px solid #334155',
            borderRadius: '10px',
          },
        }}
      />
    </div>
  )
}

export default Layout
