import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecoilValue, useRecoilState } from 'recoil'
import { AiOutlinePlus, AiOutlineAppstore, AiOutlineUnorderedList } from 'react-icons/ai'
import { filteredTasksSelector } from '../../recoil/selectors/taskSelectors'
import { taskFilterAtom } from '../../recoil/atoms/taskAtom'
import useTasks from '../../hooks/useTasks'
import useAuth from '../../hooks/useAuth'
import api from '../../api/axios'
import TaskCard from '../../components/task/TaskCard'
import TaskForm from '../../components/task/TaskForm'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'
import Badge from '../../components/common/Badge'
import { getInitials } from '../../utils/getInitials'

const getAvatarUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  const host = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase
  return `${host}${path}`
}

const STATUS_OPTIONS = ['', 'todo', 'in-progress', 'in-review', 'completed', 'blocked']
const PRIORITY_OPTIONS = ['', 'low', 'medium', 'high', 'critical']

const TasksPage = () => {
  const navigate = useNavigate()
  const tasks = useRecoilValue(filteredTasksSelector)
  const [filter, setFilter] = useRecoilState(taskFilterAtom)
  const { fetchTasks, createTask, loading, selectedTask, setSelectedTask } = useTasks()
  const { user } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [viewMode, setViewMode] = useState('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState('created-desc')

  const processedTasks = [...tasks]
    .filter((task) => {
      const term = searchTerm.toLowerCase()
      return (
        task.title?.toLowerCase().includes(term) ||
        task.description?.toLowerCase().includes(term) ||
        task.project?.name?.toLowerCase().includes(term) ||
        task.assignedTo?.name?.toLowerCase().includes(term)
      )
    })
    .sort((a, b) => {
      if (sortOrder === 'created-asc') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      } else if (sortOrder === 'created-desc') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      } else if (sortOrder === 'due-asc') {
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate) - new Date(b.dueDate)
      } else if (sortOrder === 'due-desc') {
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(b.dueDate) - new Date(a.dueDate)
      }
      return 0
    })

  useEffect(() => {
    fetchTasks()
    if (user?.role !== 'member') {
      api.get('/projects')
        .then(({ data }) => setProjects(data.projects || []))
        .catch(() => { })
      api.get('/users')
        .then(({ data }) => setUsers(data.users || []))
        .catch(() => { })
    }
  }, [user]) // eslint-disable-line

  const handleCreate = async (data) => { await createTask(data); setIsModalOpen(false) }

  const pageTitle = user?.role === 'admin' ? 'All Tasks' : user?.role === 'manager' ? 'Project Tasks' : 'My Tasks'

  return (
    <div className="animate-fade-in flex flex-col min-h-0" style={{ height: 'calc(100vh - 7.5rem)' }}>
      <div className="page-header flex-shrink-0 mb-3">
        <h1 className="page-title">{pageTitle}</h1>
        <div className="flex items-center gap-3">
          {/* Grid/List View Mode Toggle */}
          <div className="flex bg-dark-800 border border-slate-700/50 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Grid View"
              type="button"
            >
              <AiOutlineAppstore size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="List View"
              type="button"
            >
              <AiOutlineUnorderedList size={16} />
            </button>
          </div>
          {user?.role !== 'member' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              id="create-task-page-btn"
              className="px-2 py-1 text-[10px] sm:text-xs sm:px-3 sm:py-1.5 flex items-center gap-1 flex-shrink-0"
            >
              <AiOutlinePlus className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> New Task
            </Button>
          )}
        </div>
      </div>

      {/* Minimal Filter Rows */}
      <div className="flex flex-col gap-2 mb-4 flex-shrink-0">
        {/* First line: Search bar */}
        <div className="w-full lg:max-w-xs xl:max-w-md">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-dark-900 border border-slate-750/70 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 w-full"
            id="search-tasks"
          />
        </div>

        {/* Second line: Dropdowns & Actions row, with horizontal scrolling */}
        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto py-1 scrollbar-none flex-nowrap">
          <select
            className="bg-dark-900 border border-slate-750/70 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer flex-shrink-0"
            value={filter.status}
            onChange={(e) => setFilter((p) => ({ ...p, status: e.target.value }))}
            id="filter-status"
          >
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s ? s.replace(/-/g, ' ') : 'All Statuses'}</option>)}
          </select>

          <select
            className="bg-dark-900 border border-slate-750/70 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer flex-shrink-0"
            value={filter.priority}
            onChange={(e) => setFilter((p) => ({ ...p, priority: e.target.value }))}
            id="filter-priority"
          >
            {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p ? `${p.charAt(0).toUpperCase() + p.slice(1)} Priority` : 'All Priorities'}</option>)}
          </select>

          {user?.role !== 'member' && projects.length > 0 && (
            <select
              className="bg-dark-900 border border-slate-750/70 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer max-w-[150px] flex-shrink-0"
              value={filter.project || ''}
              onChange={(e) => setFilter((p) => ({ ...p, project: e.target.value }))}
              id="filter-project"
            >
              <option value="">All Projects</option>
              {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          )}

          {user?.role !== 'member' && users.length > 0 && (
            <select
              className="bg-dark-900 border border-slate-750/70 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer max-w-[150px] flex-shrink-0"
              value={filter.assignedTo || ''}
              onChange={(e) => setFilter((p) => ({ ...p, assignedTo: e.target.value }))}
              id="filter-assignee"
            >
              <option value="">All Assignees</option>
              {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          )}

          <select
            className="bg-dark-900 border border-slate-750/70 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer flex-shrink-0"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            id="sort-tasks"
          >
            <option value="created-desc">Date Created (Newest)</option>
            <option value="created-asc">Date Created (Oldest)</option>
            <option value="due-asc">Due Date (Ascending)</option>
            <option value="due-desc">Due Date (Descending)</option>
          </select>

          {(filter.status || filter.priority || filter.project || filter.assignedTo || searchTerm || sortOrder !== 'created-desc') && (
            <button
              onClick={() => {
                setFilter({ status: '', priority: '', assignedTo: '', project: '' })
                setSearchTerm('')
                setSortOrder('created-desc')
              }}
              className="text-[10px] text-primary-400 hover:text-primary-300 font-bold uppercase tracking-wider px-2 py-1 hover:underline cursor-pointer flex-shrink-0"
              id="clear-filters-btn"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Task Content List Container */}
      {loading && processedTasks.length === 0 ? (
        <div className="flex justify-center py-16 flex-1"><Spinner size="lg" /></div>
      ) : processedTasks.length === 0 ? (
        <div className="card p-12 text-center text-slate-500 flex-1">No tasks found.</div>
      ) : viewMode === 'grid' ? (
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 animate-fade-in pb-4">
            {processedTasks.map((task) => (
              <TaskCard key={task._id} task={task} onClick={(t) => navigate(`/tasks/${t._id}`)} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto border border-slate-700/50 rounded-xl bg-dark-850 shadow-md">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-dark-800 z-10 border-b border-slate-700">
              <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-2.5 px-4">Task Title</th>
                <th className="py-2.5 px-4">Project</th>
                <th className="py-2.5 px-4">Assignee</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Priority</th>
                <th className="py-2.5 px-4">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
              {processedTasks.map((task) => (
                <tr
                  key={task._id}
                  onClick={() => navigate(`/tasks/${task._id}`)}
                  className="hover:bg-dark-700/20 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-white">
                    {task.title}
                  </td>
                  <td className="py-3 px-4 text-slate-450">
                    {task.project?.name || 'Unknown Project'}
                  </td>
                  <td className="py-3 px-4">
                    {task.assignedTo ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-slate-700 font-bold text-slate-200 text-[9px] flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {task.assignedTo.avatar ? (
                            <img
                              src={getAvatarUrl(task.assignedTo.avatar)}
                              alt={task.assignedTo.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            getInitials(task.assignedTo.name) || 'U'
                          )}
                        </div>
                        <span className="truncate max-w-[100px]">{task.assignedTo.name}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic text-[10px]">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Badge type="status" value={task.status} />
                  </td>
                  <td className="py-3 px-4">
                    <Badge type="priority" value={task.priority} />
                  </td>
                  <td className="py-3 px-4 text-slate-450">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Task Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Task">
        <TaskForm onSubmit={handleCreate} loading={loading} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  )
}

export default TasksPage
