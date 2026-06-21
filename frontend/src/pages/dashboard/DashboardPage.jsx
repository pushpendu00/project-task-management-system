import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRecoilValue } from 'recoil'
import {
  AiOutlineProject, AiOutlineCheckSquare, AiOutlineClockCircle,
  AiOutlineTeam, AiOutlineArrowRight, AiOutlineDashboard,
  AiOutlineRise, AiOutlineHistory, AiOutlineBell
} from 'react-icons/ai'
import { authUserAtom }  from '../../recoil/atoms/authAtom'
import api from '../../api/axios'
import Spinner from '../../components/common/Spinner'

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card p-5 flex items-center gap-4 hover:border-slate-600 transition-all duration-200">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-slate-400 font-medium">{label}</p>
    </div>
  </div>
)

const DashboardPage = () => {
  const user = useRecoilValue(authUserAtom)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const { data } = await api.get('/reports/dashboard')
        setStats(data.stats)
      } catch (error) {
        console.error('Failed to load dashboard metrics', error)
      } finally {
        setLoading(false)
      }
    }
    if (user) fetchStats()
  }, [user])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Spinner size="lg" />
        <p className="text-slate-500 text-sm">Aggregating workspace analytics...</p>
      </div>
    )
  }

  // Render role-specific dashboards
  const isAdmin = user?.role === 'admin'
  const isManager = user?.role === 'manager'

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Logged in as <span className="text-primary-400 font-semibold capitalize">
              {user?.role === 'member' ? 'Employee' : user?.role === 'manager' ? 'Project Manager' : 'Admin'}
            </span>. Here is a summary of your workspace status.
          </p>
        </div>
        <div className="text-slate-500 text-xs font-semibold bg-dark-800 border border-slate-700/50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          System Online
        </div>
      </div>

      {/* KPI GRID FOR ADMIN */}
      {isAdmin && stats && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            <StatCard icon={AiOutlineProject}     label="Total Projects"    value={stats.totalProjects}    color="bg-primary-600" />
            <StatCard icon={AiOutlineCheckSquare} label="Total Tasks"       value={stats.totalTasks}       color="bg-blue-600" />
            <StatCard icon={AiOutlineTeam}        label="Active Employees"  value={stats.activeEmployees}  color="bg-purple-600" />
            <StatCard icon={AiOutlineCheckSquare} label="Completed Tasks"   value={stats.completedTasks}   color="bg-green-600" />
            <StatCard icon={AiOutlineClockCircle} label="Overdue Tasks"     value={stats.overdueTasks}     color="bg-red-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card p-6 lg:col-span-2 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <AiOutlineRise className="text-primary-400" /> Workspace Progress Overview
                </h3>
                <p className="text-slate-400 text-sm mb-6">Aggregate task completion rate across all registered projects.</p>
              </div>
              <div className="flex items-center gap-8 bg-dark-900/50 p-6 rounded-xl border border-slate-800">
                <div className="relative w-28 h-28 rounded-full border-8 border-dark-800 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-black text-white">{stats.progressOverview}%</span>
                  <div className="absolute inset-0 rounded-full border-8 border-primary-500 border-t-transparent animate-spin-slow opacity-20 pointer-events-none" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-300 font-semibold">Average Project Progress</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    This metric represents the ratio of completed tasks to total tasks across all system projects. Ensure managers resolve blocked and overdue items to raise this indicator.
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AiOutlineDashboard className="text-primary-400" /> Quick Actions
              </h3>
              <p className="text-slate-400 text-xs mb-2">Administrative tools shortcuts.</p>
              <div className="flex flex-col gap-2">
                <Link to="/projects" className="btn btn-primary justify-start text-xs py-2.5">
                  Manage Projects
                </Link>
                <Link to="/users" className="btn btn-secondary justify-start text-xs py-2.5">
                  Manage Team & Roles
                </Link>
                <Link to="/reports" className="btn btn-secondary justify-start text-xs py-2.5">
                  View Business Reports
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI GRID FOR PROJECT MANAGER */}
      {isManager && stats && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={AiOutlineProject}     label="Managed Projects"   value={stats.managedProjects}   color="bg-primary-600" />
            <StatCard icon={AiOutlineCheckSquare} label="Active Tasks"        value={stats.activeTasks}       color="bg-blue-600" />
            <StatCard icon={AiOutlineClockCircle} label="Upcoming Deadlines"  value={stats.upcomingDeadlines}  color="bg-orange-600" />
            <StatCard icon={AiOutlineTeam}        label="Team Logged Hours"  value={`${stats.employeeProductivity} hrs`} color="bg-green-600" />
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <AiOutlineDashboard className="text-primary-400" /> Manager Control Panel
            </h3>
            <p className="text-slate-400 text-sm mb-6">Verify deadlines and review logged efforts on your projects.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-dark-900/50 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Employee Effort Logs</h4>
                <p className="text-xs text-slate-400">Total logged hours logged by employees on tasks in your projects: <strong>{stats.employeeProductivity} hrs</strong>.</p>
                <Link to="/reports" className="text-primary-400 hover:text-primary-300 text-xs inline-flex items-center gap-1 mt-2">
                  Review Effort Reports <AiOutlineArrowRight size={12} />
                </Link>
              </div>
              <div className="bg-dark-900/50 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Project Timeline Warnings</h4>
                <p className="text-xs text-slate-400">You have <strong>{stats.upcomingDeadlines}</strong> active tasks due in the next 7 days.</p>
                <Link to="/projects" className="text-primary-400 hover:text-primary-300 text-xs inline-flex items-center gap-1 mt-2">
                  Open Project Boards <AiOutlineArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI GRID FOR EMPLOYEE */}
      {!isAdmin && !isManager && stats && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={AiOutlineCheckSquare} label="Assigned Tasks"  value={stats.assignedTasks}  color="bg-primary-600" />
            <StatCard icon={AiOutlineClockCircle} label="Tasks Due Soon"   value={stats.tasksDueSoon}   color="bg-orange-600" />
            <StatCard icon={AiOutlineCheckSquare} label="Completed Tasks"  value={stats.completedTasks}  color="bg-green-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card p-6 lg:col-span-2 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AiOutlineHistory className="text-primary-400" /> My Recent Activity Logs
              </h3>
              <p className="text-slate-400 text-xs">A log of your recent logins and password recovery operations.</p>
              <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto pr-1">
                {stats.recentActivity && stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((log) => (
                    <div key={log._id} className="py-3 flex justify-between gap-4 text-xs">
                      <div>
                        <p className="font-semibold text-white capitalize">{log.action.replace(/_/g, ' ')}</p>
                        <p className="text-slate-500 mt-0.5">Entity: {log.entity}</p>
                      </div>
                      <span className="text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic py-4">No recent activity logged.</p>
                )}
              </div>
            </div>

            <div className="card p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AiOutlineBell className="text-primary-400" /> Deadline Warnings
              </h3>
              <p className="text-slate-400 text-xs">You have <strong>{stats.tasksDueSoon}</strong> active tasks due within the next 48 hours.</p>
              <div className="bg-dark-900/50 p-4 rounded-xl border border-slate-800 space-y-2 text-center">
                <p className="text-xs text-slate-300">Keep your task statuses updated and record work logs before deadlines pass.</p>
                <Link to="/tasks" className="btn btn-primary text-xs py-2 w-full mt-2">
                  Go to Tasks Board
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage
