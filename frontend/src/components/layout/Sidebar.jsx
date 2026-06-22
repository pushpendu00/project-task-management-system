import React, { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useRecoilValue } from 'recoil'
import {
  AiOutlineDashboard, AiOutlineProject,
  AiOutlineCheckSquare, AiOutlineMenu, AiOutlineClose,
  AiOutlineTeam, AiOutlinePieChart, AiOutlineBell, AiOutlineUser
} from 'react-icons/ai'
import useAuth from '../../hooks/useAuth'
import api from '../../api/axios'
import { notificationsAtom } from '../../recoil/atoms/notificationAtom'

const getAvatarUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  const host = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase
  return `${host}${path}`
}

const Sidebar = ({ isOpen, onClose }) => {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout }          = useAuth()
  const notifications             = useRecoilValue(notificationsAtom)
  const unreadCount               = notifications.filter(n => !n.isRead).length

  // Build role-based links
  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: AiOutlineDashboard },
    { to: '/projects',  label: 'Projects',  icon: AiOutlineProject },
  ]

  if (user?.role === 'admin') {
    links.push({ to: '/tasks', label: 'All Tasks', icon: AiOutlineCheckSquare })
    links.push({ to: '/users', label: 'Manage Users', icon: AiOutlineTeam })
    links.push({ to: '/reports', label: 'System Reports', icon: AiOutlinePieChart })
  } else if (user?.role === 'manager') {
    links.push({ to: '/tasks', label: 'Project Tasks', icon: AiOutlineCheckSquare })
    links.push({ to: '/reports', label: 'Project Reports', icon: AiOutlinePieChart })
    links.push({
      to: '/notifications',
      label: 'Notifications',
      icon: AiOutlineBell,
      count: unreadCount,
    })
  } else if (user?.role === 'member') {
    links.push({ to: '/tasks', label: 'My Tasks', icon: AiOutlineCheckSquare })
    links.push({
      to: '/notifications',
      label: 'Notifications',
      icon: AiOutlineBell,
      count: unreadCount,
    })
  }

  return (
    <>
      {/* Mobile drawer backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-dark-800 border-r border-slate-700/50 transition-all duration-300
                    ${collapsed ? 'w-16' : 'w-60'}
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                    md:translate-x-0 md:sticky md:top-0 md:flex h-screen flex-shrink-0`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50 flex-shrink-0">
          {!collapsed && (
            <span className="text-lg font-bold text-white truncate">
              <span className="text-primary-400">Task</span>Flow
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-700 transition-colors ml-auto hidden md:block"
            id="sidebar-toggle-btn"
          >
            {collapsed ? <AiOutlineMenu size={18} /> : <AiOutlineClose size={18} />}
          </button>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-700 transition-colors ml-auto md:hidden"
            id="sidebar-mobile-close-btn"
          >
            <AiOutlineClose size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto min-h-0">
          {links.map(({ to, label, icon: Icon, count }) => (
            <NavLink
              key={to}
              to={to}
              id={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <div className="relative flex items-center justify-center flex-shrink-0">
                <Icon size={20} />
                {count > 0 && collapsed && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-primary-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold">
                    {count}
                  </span>
                )}
              </div>
              {!collapsed && (
                <div className="flex items-center justify-between w-full">
                  <span>{label}</span>
                  {count > 0 && (
                    <span className="bg-primary-600/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {count}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
