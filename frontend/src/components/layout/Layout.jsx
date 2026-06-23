import React, { useState, useEffect, useRef } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import { useRecoilValue, useRecoilState } from 'recoil'
import { AiOutlineMenu, AiOutlineLogout, AiOutlineBell, AiOutlineSun, AiOutlineMoon, AiOutlineDesktop, AiOutlineCheck } from 'react-icons/ai'
import Sidebar from './Sidebar'
import { useTheme } from '../../context/ThemeContext'
import useAuth from '../../hooks/useAuth'
import { authTokenAtom } from '../../recoil/atoms/authAtom'
import { notificationsAtom } from '../../recoil/atoms/notificationAtom'
import useNotifications from '../../hooks/useNotifications'
import api from '../../api/axios'
import { getInitials } from '../../utils/getInitials'

const getAvatarUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  const host = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase
  return `${host}${path}`
}

const Layout = ({ children }) => {
  const { theme, setTheme, activeTheme } = useTheme()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const token = useRecoilValue(authTokenAtom)
  const [notifications, setNotifications] = useRecoilState(notificationsAtom)
  const { fetchNotifications, markAsRead } = useNotifications()
  const navigate = useNavigate()

  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const notificationsRef = useRef(null)
  const profileRef = useRef(null)
  const themeMenuRef = useRef(null)

  const unreadCount = notifications.filter(n => !n.isRead).length

  // Fetch initial list of notifications
  useEffect(() => {
    if (token && user) {
      fetchNotifications()
    }
  }, [token, user]) // eslint-disable-line

  // Handle outside clicks to close the dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setThemeMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotifClick = async (n) => {
    setNotificationsOpen(false)
    if (!n.isRead) {
      await markAsRead(n._id)
    }
    if (n.relatedLink) {
      navigate(n.relatedLink)
    }
  }

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
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              title="Open menu"
            >
              <AiOutlineMenu size={20} />
            </button>
            <span className="text-lg font-bold text-slate-100 tracking-wider md:hidden">
              <span className="text-primary-400">Task</span>Flow
            </span>
          </div>

          {/* Right section: Profile & Quick actions */}
          <div className="flex items-center gap-4">
            {/* Theme Dropdown Selection Switcher */}
            <div className="relative" ref={themeMenuRef}>
              <button
                onClick={() => {
                  setThemeMenuOpen(!themeMenuOpen)
                  setNotificationsOpen(false)
                  setProfileOpen(false)
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors flex-shrink-0 focus:outline-none cursor-pointer flex items-center justify-center"
                title="Select Theme"
                id="theme-select-btn"
              >
                {theme === 'light' ? <AiOutlineSun size={20} /> : theme === 'dark' ? <AiOutlineMoon size={20} /> : <AiOutlineDesktop size={20} />}
              </button>

              {themeMenuOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-dark-850 border border-slate-700/60 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in p-1 text-left space-y-0.5">
                  <button
                    onClick={() => {
                      setTheme('light')
                      setThemeMenuOpen(false)
                    }}
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded transition-colors cursor-pointer flex items-center justify-between font-medium ${
                      theme === 'light'
                        ? 'bg-primary-600/20 text-primary-600 dark:text-primary-400 font-bold'
                        : 'text-slate-350 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <AiOutlineSun size={14} /> Light
                    </span>
                    {theme === 'light' && <AiOutlineCheck size={12} />}
                  </button>

                  <button
                    onClick={() => {
                      setTheme('dark')
                      setThemeMenuOpen(false)
                    }}
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded transition-colors cursor-pointer flex items-center justify-between font-medium ${
                      theme === 'dark'
                        ? 'bg-primary-600/20 text-primary-600 dark:text-primary-400 font-bold'
                        : 'text-slate-350 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <AiOutlineMoon size={14} /> Dark
                    </span>
                    {theme === 'dark' && <AiOutlineCheck size={12} />}
                  </button>

                  <button
                    onClick={() => {
                      setTheme('system')
                      setThemeMenuOpen(false)
                    }}
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded transition-colors cursor-pointer flex items-center justify-between font-medium ${
                      theme === 'system'
                        ? 'bg-primary-600/20 text-primary-600 dark:text-primary-400 font-bold'
                        : 'text-slate-350 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <AiOutlineDesktop size={14} /> System
                    </span>
                    {theme === 'system' && <AiOutlineCheck size={12} />}
                  </button>
                </div>
              )}
            </div>

            {/* Notification Icon and Popup Dropdown */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen)
                  setProfileOpen(false)
                }}
                className="relative p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors flex-shrink-0 focus:outline-none cursor-pointer"
                title="Notifications"
                id="navbar-notifications-btn"
              >
                <AiOutlineBell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-primary-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold px-1 border border-dark-800">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-dark-850 border border-slate-700/60 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in text-left">
                  <div className="p-3 border-b border-slate-700/50 flex justify-between items-center bg-dark-900/30">
                    <span className="text-xs font-bold text-slate-100">Latest Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-primary-900/40 text-primary-400 border border-primary-800/40 px-1.5 py-0.5 rounded-full font-bold">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/40">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n._id}
                          onClick={() => handleNotifClick(n)}
                          className={`p-3 flex items-start gap-2.5 cursor-pointer hover:bg-dark-700/40 transition-colors ${
                            !n.isRead ? 'bg-primary-900/5' : ''
                          }`}
                        >
                          <span className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                            !n.isRead ? 'bg-primary-500' : 'bg-transparent'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-[11px] leading-snug break-words ${
                              !n.isRead ? 'text-slate-100 font-medium' : 'text-slate-400'
                            }`}>
                              {n.message}
                            </p>
                            <span className="text-[9px] text-slate-500 mt-1 block">
                              {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <Link
                    to="/notifications"
                    onClick={() => setNotificationsOpen(false)}
                    className="block text-center text-xs font-semibold text-primary-400 hover:text-primary-355 py-2.5 border-t border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/60 transition-colors"
                  >
                    Show More
                  </Link>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => {
                  setProfileOpen(!profileOpen)
                  setNotificationsOpen(false)
                }}
                className="w-8 h-8 rounded-full bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm flex items-center justify-center border border-primary-500/30 transition-colors focus:outline-none cursor-pointer overflow-hidden"
                title="Account Menu"
                id="navbar-profile-btn"
              >
                {user?.avatar ? (
                  <img
                    src={getAvatarUrl(user.avatar)}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(user?.name)
                )}
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-dark-850 border border-slate-700/60 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in p-1.5 text-left">
                  <div className="px-3 py-2 flex items-center gap-2">
                    {user?.avatar ? (
                      <img
                        src={getAvatarUrl(user.avatar)}
                        alt={user.name}
                        className="w-7 h-7 rounded-full object-cover border border-primary-500/20"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary-700 text-white font-bold text-xs flex items-center justify-center">
                        {getInitials(user?.name)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-100 truncate">{user?.name}</p>
                      <p className="text-[9px] text-slate-500 capitalize leading-none mt-0.5">
                        {user?.role === 'member' ? 'Employee' : user?.role === 'manager' ? 'Project Manager' : 'Admin'}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-slate-700/40 my-1" />
                  
                  <Link
                    to="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="block w-full text-left text-xs text-slate-300 hover:text-slate-100 px-3 py-2 hover:bg-slate-800 rounded-lg transition-colors font-medium animate-none"
                  >
                    Profile
                  </Link>
                  
                  <button
                    onClick={() => {
                      setProfileOpen(false)
                      logout()
                    }}
                    className="w-full text-left text-xs text-red-400 hover:text-red-300 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors mt-0.5 flex items-center gap-1.5 font-medium cursor-pointer"
                  >
                    <AiOutlineLogout size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
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
            background:   'rgb(var(--toast-bg))',
            color:        'rgb(var(--toast-color))',
            border:       '1px solid rgb(var(--toast-border))',
            borderRadius: '10px',
          },
        }}
      />
    </div>
  )
}

export default Layout
