import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  AiOutlineDashboard, AiOutlineProject,
  AiOutlineCheckSquare, AiOutlineMenu, AiOutlineClose,
} from 'react-icons/ai'
import useAuth from '../../hooks/useAuth'

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: AiOutlineDashboard   },
  { to: '/projects',  label: 'Projects',  icon: AiOutlineProject     },
  { to: '/tasks',     label: 'My Tasks',  icon: AiOutlineCheckSquare },
]

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout }          = useAuth()

  return (
    <aside className={`flex flex-col bg-dark-800 border-r border-slate-700/50 transition-all duration-300
                       ${collapsed ? 'w-16' : 'w-60'} min-h-screen sticky top-0`}>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        {!collapsed && (
          <span className="text-lg font-bold text-white truncate">
            <span className="text-primary-400">Task</span>Flow
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-700 transition-colors ml-auto"
          id="sidebar-toggle-btn"
        >
          {collapsed ? <AiOutlineMenu size={18} /> : <AiOutlineClose size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            id={`nav-${label.toLowerCase().replace(' ', '-')}`}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={20} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-700/50">
        <div className={`flex items-center gap-3 px-2 py-2 rounded-lg ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center
                          text-white text-sm font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{user?.role}</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button onClick={logout} id="logout-btn"
                  className="w-full mt-2 btn-ghost text-sm py-2 rounded-lg text-left px-2">
            Logout
          </button>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
