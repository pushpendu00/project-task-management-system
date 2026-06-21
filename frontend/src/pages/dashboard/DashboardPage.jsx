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
  <div className="card p-4 flex items-center gap-4 hover:border-slate-600 transition-all duration-200">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-xl font-bold text-white truncate">{value}</p>
      <p className="text-xs text-slate-400 font-semibold truncate uppercase tracking-wider">{label}</p>
    </div>
  </div>
)

const ProjectStatusProgress = ({ label, count, max, color }) => {
  const percentage = max > 0 ? (count / max) * 100 : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs font-semibold">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-bold">{count}</span>
      </div>
      <div className="w-full h-1.5 bg-dark-900 rounded-full overflow-hidden border border-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

const CompletionTrendChart = ({ trend }) => {
  if (!trend || trend.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-xs text-slate-500 italic">
        No recent task activity trends available.
      </div>
    )
  }

  const maxVal = Math.max(...trend.map(t => t.count), 2)
  const height = 140
  const width = 500
  const paddingX = 40
  const paddingY = 20
  
  const chartWidth = width - paddingX * 2
  const chartHeight = height - paddingY * 2
  
  const points = trend.map((t, idx) => {
    const x = paddingX + (idx * (chartWidth / (trend.length - 1)))
    const y = height - paddingY - (t.count / maxVal) * chartHeight
    return { x, y }
  })
  
  const linePath = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`
  const areaPath = `${linePath} L ${points[points.length - 1].x},${height - paddingY} L ${points[0].x},${height - paddingY} Z`

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
        <defs>
          <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {/* Horizontal grid lines */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = paddingY + ratio * chartHeight
          const val = Math.round(maxVal * (1 - ratio))
          return (
            <g key={idx} className="opacity-25">
              <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#475569" strokeDasharray="3 3" strokeWidth="0.8" />
              <text x={paddingX - 8} y={y + 3} fill="#94a3b8" fontSize="8" textAnchor="end" className="font-semibold">{val}</text>
            </g>
          )
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#chartAreaGrad)" />
        
        {/* Line */}
        <path d={linePath} fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle
              cx={p.x}
              cy={p.y}
              r="3.5"
              fill="#0ea5e9"
              stroke="#0f172a"
              strokeWidth="1.5"
            />
            <title>{`${trend[idx].count} tasks completed`}</title>
          </g>
        ))}
        
        {/* X Axis labels */}
        {trend.map((t, idx) => {
          const x = paddingX + (idx * (chartWidth / (trend.length - 1)))
          return (
            <text
              key={idx}
              x={x}
              y={height - 2}
              fill="#64748b"
              fontSize="8"
              textAnchor="middle"
              className="font-bold"
            >
              {t.day}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

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
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Logged in as <span className="text-primary-400 font-semibold capitalize">
              {user?.role === 'member' ? 'Employee' : user?.role === 'manager' ? 'Project Manager' : 'Admin'}
            </span>. Here is a summary of your workspace status.
          </p>
        </div>
        <div className="text-slate-500 text-[10px] font-bold bg-dark-800 border border-slate-700/50 px-2.5 py-1 rounded-lg flex items-center gap-1.5 flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          System Online
        </div>
      </div>

      {/* KPI GRID FOR ADMIN */}
      {isAdmin && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard icon={AiOutlineProject}     label="Total Projects"     value={stats.totalProjects}     color="bg-blue-600" />
            <StatCard icon={AiOutlineClockCircle} label="Active Projects"    value={stats.activeProjects}    color="bg-amber-500" />
            <StatCard icon={AiOutlineCheckSquare} label="Completed Proj"     value={stats.completedProjects} color="bg-green-600" />
            <StatCard icon={AiOutlineCheckSquare} label="Total Tasks"        value={stats.totalTasks}        color="bg-indigo-600" />
            <StatCard icon={AiOutlineCheckSquare} label="Completed Tasks"    value={stats.completedTasks}    color="bg-teal-600" />
            <StatCard icon={AiOutlineClockCircle} label="Overdue Tasks"      value={stats.overdueTasks}      color="bg-red-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Trend Chart (Line Graph) */}
            <div className="card p-5 lg:col-span-2 space-y-4 shadow-md">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                  <AiOutlineRise className="text-primary-400" /> Task Completion Trend
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">Tasks completed daily over the past 7 days.</p>
              </div>
              <div className="bg-dark-900/40 p-4 rounded-xl border border-slate-800/60">
                <CompletionTrendChart trend={stats.completionTrend} />
              </div>
            </div>

            {/* Status Breakdown (Bar Chart) */}
            <div className="card p-5 space-y-4 shadow-md">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                  <AiOutlineProject className="text-primary-400" /> Project Statuses
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">Breakdown of registered projects by status.</p>
              </div>
              <div className="space-y-3.5 pt-1">
                <ProjectStatusProgress label="Planning" count={stats.projectBreakdown?.planning || 0} max={stats.totalProjects} color="bg-cyan-500" />
                <ProjectStatusProgress label="Active" count={stats.projectBreakdown?.active || 0} max={stats.totalProjects} color="bg-amber-500" />
                <ProjectStatusProgress label="Completed" count={stats.projectBreakdown?.completed || 0} max={stats.totalProjects} color="bg-green-500" />
                <ProjectStatusProgress label="On Hold" count={stats.projectBreakdown?.onHold || 0} max={stats.totalProjects} color="bg-slate-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Progress overview ring */}
            <div className="card p-5 lg:col-span-2 flex items-center gap-6 shadow-md">
              <div className="relative w-20 h-20 rounded-full border-4 border-dark-800 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-black text-white">{stats.progressOverview}%</span>
                <div className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin-slow opacity-20 pointer-events-none" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Average Project Progress</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  This metric represents the ratio of completed tasks to total tasks across all system projects. Ensure managers resolve blocked and overdue items to raise this indicator.
                </p>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="card p-5 space-y-3.5 shadow-md">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-700/50 pb-1.5">
                Quick Actions
              </h3>
              <div className="flex flex-col gap-2">
                <Link to="/projects" className="btn btn-primary justify-start text-xs py-2">
                  Manage Projects
                </Link>
                <Link to="/users" className="btn btn-secondary justify-start text-xs py-2">
                  Manage Team & Roles
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI GRID FOR PROJECT MANAGER */}
      {isManager && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard icon={AiOutlineProject}     label="Managed Projects"   value={stats.totalProjects}     color="bg-blue-600" />
            <StatCard icon={AiOutlineClockCircle} label="Active Projects"    value={stats.activeProjects}    color="bg-amber-500" />
            <StatCard icon={AiOutlineCheckSquare} label="Completed Proj"     value={stats.completedProjects} color="bg-green-600" />
            <StatCard icon={AiOutlineCheckSquare} label="Active Tasks"       value={stats.activeTasks}       color="bg-indigo-600" />
            <StatCard icon={AiOutlineClockCircle} label="Due Soon (7 days)"  value={stats.upcomingDeadlines} color="bg-orange-600" />
            <StatCard icon={AiOutlineTeam}        label="Team Hours"         value={`${stats.employeeProductivity} hrs`} color="bg-teal-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Trend Chart (Line Graph) */}
            <div className="card p-5 lg:col-span-2 space-y-4 shadow-md">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                  <AiOutlineRise className="text-primary-400" /> Managed Tasks Trend
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">Tasks completed daily across your managed projects.</p>
              </div>
              <div className="bg-dark-900/40 p-4 rounded-xl border border-slate-800/60">
                <CompletionTrendChart trend={stats.completionTrend} />
              </div>
            </div>

            {/* Status Breakdown (Bar Chart) */}
            <div className="card p-5 space-y-4 shadow-md">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                  <AiOutlineProject className="text-primary-400" /> Project Statuses
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">Status breakdown of your managed projects.</p>
              </div>
              <div className="space-y-3.5 pt-1">
                <ProjectStatusProgress label="Planning" count={stats.projectBreakdown?.planning || 0} max={stats.totalProjects} color="bg-cyan-500" />
                <ProjectStatusProgress label="Active" count={stats.projectBreakdown?.active || 0} max={stats.totalProjects} color="bg-amber-500" />
                <ProjectStatusProgress label="Completed" count={stats.projectBreakdown?.completed || 0} max={stats.totalProjects} color="bg-green-500" />
                <ProjectStatusProgress label="On Hold" count={stats.projectBreakdown?.onHold || 0} max={stats.totalProjects} color="bg-slate-500" />
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2 uppercase tracking-wider">
              <AiOutlineDashboard className="text-primary-400" /> Manager Control Panel
            </h3>
            <p className="text-slate-400 text-xs mb-4">Verify deadlines and review logged efforts on your projects.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-dark-900/50 p-4 rounded-xl border border-slate-800/60 space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Employee Effort Logs</h4>
                <p className="text-xs text-slate-400">Total logged hours logged by employees on tasks in your projects: <strong>{stats.employeeProductivity} hrs</strong>.</p>
                <Link to="/reports" className="text-primary-400 hover:text-primary-300 text-xs inline-flex items-center gap-1 mt-2">
                  Review Effort Reports <AiOutlineArrowRight size={12} />
                </Link>
              </div>
              <div className="bg-dark-900/50 p-4 rounded-xl border border-slate-800/60 space-y-2">
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard icon={AiOutlineCheckSquare} label="Assigned Tasks"  value={stats.assignedTasks}   color="bg-blue-600" />
            <StatCard icon={AiOutlineClockCircle} label="Tasks Due Soon"   value={stats.tasksDueSoon}     color="bg-red-600" />
            <StatCard icon={AiOutlineCheckSquare} label="Completed Tasks"  value={stats.completedTasks}   color="bg-green-600" />
            <StatCard icon={AiOutlineProject}     label="My Projects"     value={stats.totalProjects}     color="bg-indigo-600" />
            <StatCard icon={AiOutlineClockCircle} label="Active Projects"    value={stats.activeProjects}    color="bg-amber-500" />
            <StatCard icon={AiOutlineCheckSquare} label="Completed Proj"     value={stats.completedProjects} color="bg-teal-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Trend Chart (Line Graph) */}
            <div className="card p-5 lg:col-span-2 space-y-4 shadow-md">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                  <AiOutlineRise className="text-primary-400" /> My Completion Trend
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">Tasks completed daily by you over the past 7 days.</p>
              </div>
              <div className="bg-dark-900/40 p-4 rounded-xl border border-slate-800/60">
                <CompletionTrendChart trend={stats.completionTrend} />
              </div>
            </div>

            {/* Status Breakdown (Bar Chart) */}
            <div className="card p-5 space-y-4 shadow-md">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                  <AiOutlineProject className="text-primary-400" /> Project Statuses
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">Status breakdown of your active projects.</p>
              </div>
              <div className="space-y-3.5 pt-1">
                <ProjectStatusProgress label="Planning" count={stats.projectBreakdown?.planning || 0} max={stats.totalProjects} color="bg-cyan-500" />
                <ProjectStatusProgress label="Active" count={stats.projectBreakdown?.active || 0} max={stats.totalProjects} color="bg-amber-500" />
                <ProjectStatusProgress label="Completed" count={stats.projectBreakdown?.completed || 0} max={stats.totalProjects} color="bg-green-500" />
                <ProjectStatusProgress label="On Hold" count={stats.projectBreakdown?.onHold || 0} max={stats.totalProjects} color="bg-slate-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Recent Activity */}
            <div className="card p-5 lg:col-span-2 space-y-3 shadow-md">
              <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider border-b border-slate-700/50 pb-1.5">
                <AiOutlineHistory className="text-primary-400" /> Recent Activity Logs
              </h3>
              <p className="text-slate-500 text-[11px]">Audit records of your operations in the workspace.</p>
              <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto pr-1">
                {stats.recentActivity && stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((log) => (
                    <div key={log._id} className="py-2.5 flex justify-between gap-4 text-xs">
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

            {/* Deadline Warnings */}
            <div className="card p-5 space-y-4 shadow-md">
              <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider border-b border-slate-700/50 pb-1.5">
                <AiOutlineBell className="text-primary-400" /> Deadline Warnings
              </h3>
              <p className="text-slate-500 text-[11px]">You have <strong>{stats.tasksDueSoon}</strong> active tasks due within the next 48 hours.</p>
              <div className="bg-dark-900/50 p-4 rounded-xl border border-slate-800/60 space-y-2 text-center">
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
