import React, { useEffect, useState, useRef } from 'react'
import toast from 'react-hot-toast'
import {
  AiOutlineFilePdf, AiOutlinePieChart, AiOutlineTeam,
  AiOutlineHistory, AiOutlineProject, AiOutlineClockCircle
} from 'react-icons/ai'
import { useRecoilValue } from 'recoil'
import { useSearchParams } from 'react-router-dom'
import html2pdf from 'html2pdf.js'
import { authUserAtom } from '../../recoil/atoms/authAtom'
import api from '../../api/axios'
import Spinner from '../../components/common/Spinner'
import Select from '../../components/common/Select'
import { getInitials } from '../../utils/getInitials'

const getAvatarUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  const host = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase
  return `${host}${path}`
}

const ReportsPage = () => {
  const user = useRecoilValue(authUserAtom)
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab') || 'projects'
  const isAdmin = user?.role === 'admin'
  const activeTab = (rawTab === 'employees' || rawTab === 'audit') && !isAdmin ? 'projects' : rawTab
  const setActiveTab = (tab) => setSearchParams({ tab })

  useEffect(() => {
    if (rawTab !== activeTab) {
      setSearchParams({ tab: activeTab }, { replace: true })
    }
  }, [rawTab, activeTab, setSearchParams])
  const [projectsList, setProjectsList] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [projectReport, setProjectReport] = useState(null)
  const [projLoading, setProjLoading] = useState(false)
  const [employeeReport, setEmployeeReport] = useState([])
  const [empLoading, setEmpLoading] = useState(false)
  const [auditLogs, setAuditLogs] = useState([])
  const [auditLoading, setAuditLoading] = useState(false)

  // Custom Dropdown State
  const [projectSearch, setProjectSearch] = useState('')
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false)
  const projectDropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target)) {
        setProjectDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredProjects = projectsList
    .filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()))
    .slice(0, 5) // max latest 5 projects

  // Fetch list of projects for dropdown selection
  useEffect(() => {
    api.get('/projects')
      .then(({ data }) => {
        setProjectsList(data.projects || [])
        if (data.projects?.length > 0) {
          setSelectedProjectId(data.projects[0]._id)
        }
      })
      .catch(() => toast.error('Failed to load projects list'))
  }, [])

  // Fetch project report details when project selection changes
  useEffect(() => {
    if (selectedProjectId && activeTab === 'projects') {
      setProjLoading(true)
      api.get(`/reports/projects/${selectedProjectId}`)
        .then(({ data }) => {
          setProjectReport(data.report)
        })
        .catch(() => toast.error('Failed to load project report'))
        .finally(() => setProjLoading(false))
    }
  }, [selectedProjectId, activeTab])

  // Fetch employee report when tab is active
  useEffect(() => {
    if (activeTab === 'employees') {
      setEmpLoading(true)
      api.get('/reports/employees')
        .then(({ data }) => {
          setEmployeeReport(data.report || [])
        })
        .catch(() => toast.error('Failed to load employee reports'))
        .finally(() => setEmpLoading(false))
    }
  }, [activeTab])

  // Fetch audit logs when tab is active
  useEffect(() => {
    if (activeTab === 'audit' && user?.role === 'admin') {
      setAuditLoading(true)
      api.get('/reports/audit-logs')
        .then(({ data }) => {
          setAuditLogs(data.logs || [])
        })
        .catch(() => toast.error('Failed to load system audit logs'))
        .finally(() => setAuditLoading(false))
    }
  }, [activeTab, user])

  const handleExportPDF = () => {
    const element = document.getElementById('report-content')
    if (!element) return

    toast.loading('Generating PDF report...', { id: 'pdf-toast' })
    const opt = {
      margin: 0.4,
      filename: `TaskFlow_${activeTab}_report.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, backgroundColor: '#0f172a', useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }

    html2pdf().set(opt).from(element).save()
      .then(() => toast.success('PDF report exported successfully!', { id: 'pdf-toast' }))
      .catch(() => toast.error('Failed to export PDF', { id: 'pdf-toast' }))
  }

  return (
    <div className="animate-fade-in space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="page-header border-b border-slate-800 pb-5">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <AiOutlinePieChart className="text-primary-400" /> Analytics & Reports
          </h1>
          <p className="text-slate-400 text-sm mt-1">Review organizational performance, logged efforts, and audit logs.</p>
        </div>
        <button onClick={handleExportPDF} className="btn btn-primary text-xs" id="export-pdf-btn">
          <AiOutlineFilePdf size={18} /> Export PDF Report
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-700/50 gap-4">
        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-2.5 font-semibold text-sm border-b-2 transition-all ${activeTab === 'projects' ? 'border-primary-500 text-primary-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
        >
          Project Performance
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('employees')}
            className={`pb-2.5 font-semibold text-sm border-b-2 transition-all ${activeTab === 'employees' ? 'border-primary-500 text-primary-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            Employee Productivity
          </button>
        )}
        {isAdmin && (
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-2.5 font-semibold text-sm border-b-2 transition-all ${activeTab === 'audit' ? 'border-primary-500 text-primary-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            System Audit Trail
          </button>
        )}
      </div>

      {/* Report Content Panel */}
      <div id="report-content" className="p-2">
        {/* PROJECT TABS */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 flex-wrap bg-dark-800/40 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Project:</span>
              <div className="relative flex-shrink-0" ref={projectDropdownRef}>
                <button
                  type="button"
                  onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                  className="w-80 bg-dark-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none flex items-center justify-between hover:border-slate-600 transition-colors"
                >
                  <span className="truncate">
                    {projectsList.find(p => p._id === selectedProjectId)?.name || 'Select a project...'}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-1">▼</span>
                </button>

                {projectDropdownOpen && (
                  <div className="absolute z-50 left-0 mt-1 w-80 bg-dark-850 border border-slate-700/60 rounded-lg shadow-xl p-2 space-y-2">
                    <input
                      type="text"
                      placeholder="Search project name..."
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-dark-900 border border-slate-700 rounded text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      autoFocus
                    />
                    <div className="max-h-[160px] overflow-y-auto space-y-0.5 custom-scrollbar">
                      {filteredProjects.length > 0 ? (
                        filteredProjects.map((p) => (
                          <button
                            key={p._id}
                            type="button"
                            onClick={() => {
                              setSelectedProjectId(p._id)
                              setProjectDropdownOpen(false)
                              setProjectSearch('')
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors flex items-center justify-between ${
                              selectedProjectId === p._id
                                ? 'bg-primary-600/20 text-primary-400 font-medium'
                                : 'text-slate-350 hover:bg-slate-800 hover:text-slate-100'
                            }`}
                          >
                            <span className="truncate">{p.name}</span>
                          </button>
                        ))
                      ) : (
                        <div className="text-center py-2 text-xs text-slate-500">
                          No projects found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {projLoading ? (
              <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : !projectReport ? (
              <div className="card p-12 text-center text-slate-500">No project selected or loaded.</div>
            ) : (
              <div className="space-y-6">
                {/* Project Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="card p-5 bg-dark-850">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Completion Rate</p>
                    <p className="text-3xl font-black text-primary-400 mt-2">{projectReport.completionRate}%</p>
                    <div className="w-full bg-dark-900 rounded-full h-1.5 mt-3">
                      <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${projectReport.completionRate}%` }} />
                    </div>
                  </div>
                  <div className="card p-5 bg-dark-850">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Tasks</p>
                    <p className="text-3xl font-black text-slate-100 mt-2">{projectReport.totalTasks}</p>
                  </div>
                  <div className="card p-5 bg-dark-850">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Completed Tasks</p>
                    <p className="text-3xl font-black text-green-400 mt-2">{projectReport.completedTasks}</p>
                  </div>
                  <div className="card p-5 bg-dark-850">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Pending Tasks</p>
                    <p className="text-3xl font-black text-orange-400 mt-2">{projectReport.pendingTasks}</p>
                  </div>
                </div>

                {/* Grid charts breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Status counts card */}
                  <div className="card p-6">
                    <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-4 border-b border-slate-700/50 pb-2">
                      Tasks Status Distribution
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(projectReport.statusCounts).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between text-sm">
                          <span className="capitalize text-slate-300">{status.replace('-', ' ')}</span>
                          <div className="flex items-center gap-3 w-2/3">
                            <div className="w-full bg-dark-900 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${status === 'completed' ? 'bg-green-500' :
                                    status === 'blocked' ? 'bg-red-500' :
                                      status === 'in-progress' ? 'bg-blue-500' :
                                        status === 'in-review' ? 'bg-yellow-500' : 'bg-slate-500'
                                  }`}
                                style={{ width: `${projectReport.totalTasks > 0 ? (count / projectReport.totalTasks) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-400 min-w-4 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Priority counts card */}
                  <div className="card p-6">
                    <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-4 border-b border-slate-700/50 pb-2">
                      Tasks Priority Distribution
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(projectReport.priorityCounts).map(([priority, count]) => (
                        <div key={priority} className="flex items-center justify-between text-sm">
                          <span className="capitalize text-slate-300">{priority}</span>
                          <div className="flex items-center gap-3 w-2/3">
                            <div className="w-full bg-dark-900 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${priority === 'critical' ? 'bg-red-600' :
                                    priority === 'high' ? 'bg-orange-500' :
                                      priority === 'medium' ? 'bg-blue-500' : 'bg-slate-500'
                                  }`}
                                style={{ width: `${projectReport.totalTasks > 0 ? (count / projectReport.totalTasks) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-400 min-w-4 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* EMPLOYEE TABS */}
        {activeTab === 'employees' && (
          <div className="space-y-4">
            {empLoading ? (
              <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : employeeReport.length === 0 ? (
              <div className="card p-12 text-center text-slate-500">No employee productivity logs available.</div>
            ) : (
              <div className="card border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-dark-800 border-b border-slate-700 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="py-4 px-6">Employee</th>
                        <th className="py-4 px-6 text-center">Assigned Tasks</th>
                        <th className="py-4 px-6 text-center">Completed Tasks</th>
                        <th className="py-4 px-6 text-center">Total Hours Logged</th>
                        <th className="py-4 px-6 text-center">Avg Completion Speed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                      {employeeReport.map((emp) => (
                        <tr key={emp.employeeId} className="hover:bg-dark-800/10">
                          <td className="py-4 px-6 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-700 font-bold text-slate-200 text-xs flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {emp.avatar ? (
                                <img
                                  src={getAvatarUrl(emp.avatar)}
                                  alt={emp.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                getInitials(emp.name)
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-100">{emp.name}</p>
                              <p className="text-[10px] text-slate-500">{emp.email}</p>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center font-semibold text-slate-100">{emp.assignedTasks}</td>
                          <td className="py-4 px-6 text-center text-green-400 font-semibold">{emp.completedTasks}</td>
                          <td className="py-4 px-6 text-center text-primary-400 font-semibold">{emp.totalHoursLogged} hrs</td>
                          <td className="py-4 px-6 text-center text-slate-300 font-semibold">
                            {emp.avgCompletionTimeHours > 0 ? (
                              <span className="flex items-center justify-center gap-1">
                                <AiOutlineClockCircle /> {emp.avgCompletionTimeHours} hrs/task
                              </span>
                            ) : (
                              'N/A'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AUDIT LOG TABS */}
        {activeTab === 'audit' && isAdmin && (
          <div className="space-y-4">
            {auditLoading ? (
              <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : auditLogs.length === 0 ? (
              <div className="card p-12 text-center text-slate-500">No activity logs recorded.</div>
            ) : (
              <div className="card border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-dark-800 border-b border-slate-700 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="py-4 px-6">Timestamp</th>
                        <th className="py-4 px-6">User</th>
                        <th className="py-4 px-6">Action</th>
                        <th className="py-4 px-6">Entity</th>
                        <th className="py-4 px-6">Entity ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                      {auditLogs.map((log) => (
                        <tr key={log._id} className="hover:bg-dark-800/10">
                          <td className="py-3 px-6 text-slate-400 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3 px-6 font-medium text-slate-100">
                            {log.user?.name || 'System / Unregistered'}
                          </td>
                          <td className="py-3 px-6 capitalize">
                            <span className="font-semibold text-primary-400 bg-primary-950/20 px-2 py-0.5 rounded">
                              {log.action.replace(/_/g, ' ').toLowerCase()}
                            </span>
                          </td>
                          <td className="py-3 px-6 font-semibold">{log.entity}</td>
                          <td className="py-3 px-6 text-slate-500 font-mono">{log.entityId || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ReportsPage
