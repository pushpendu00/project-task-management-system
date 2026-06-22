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
    <div className="animate-fade-in">
      <div className="page-header">
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
            <Button variant="primary" onClick={() => setIsModalOpen(true)} id="create-task-page-btn">
              <AiOutlinePlus size={18} /> New Task
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <select className="input w-auto text-sm bg-dark-800" value={filter.status}
          onChange={(e) => setFilter((p) => ({ ...p, status: e.target.value }))} id="filter-status">
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s ? s.replace(/-/g, ' ') : 'All Statuses'}</option>)}
        </select>
        <select className="input w-auto text-sm bg-dark-800" value={filter.priority}
          onChange={(e) => setFilter((p) => ({ ...p, priority: e.target.value }))} id="filter-priority">
          {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p || 'All Priorities'}</option>)}
        </select>

        {user?.role !== 'member' && projects.length > 0 && (
          <select className="input w-auto text-sm bg-dark-800" value={filter.project || ''}
            onChange={(e) => setFilter((p) => ({ ...p, project: e.target.value }))} id="filter-project">
            <option value="">All Projects</option>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        )}

        {user?.role !== 'member' && users.length > 0 && (
          <select className="input w-auto text-sm bg-dark-800" value={filter.assignedTo || ''}
            onChange={(e) => setFilter((p) => ({ ...p, assignedTo: e.target.value }))} id="filter-assignee">
            <option value="">All Assignees</option>
            {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
        )}

        {(filter.status || filter.priority || filter.project || filter.assignedTo) && (
          <Button variant="ghost" size="sm"
            onClick={() => setFilter({ status: '', priority: '', assignedTo: '', project: '' })} id="clear-filters-btn">
            Clear Filters
          </Button>
        )}
      </div>

      {loading && tasks.length === 0 ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : tasks.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">No tasks found.</div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 animate-fade-in">
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} onClick={(t) => navigate(`/tasks/${t._id}`)} />
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden border border-slate-700/50 animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dark-800 border-b border-slate-700 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3 px-5">Task Title</th>
                  <th className="py-3 px-5">Project</th>
                  <th className="py-3 px-5">Assignee</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Priority</th>
                  <th className="py-3 px-5">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                {tasks.map((task) => (
                  <tr
                    key={task._id}
                    onClick={() => navigate(`/tasks/${task._id}`)}
                    className="hover:bg-dark-800/20 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-5 font-semibold text-white">
                      {task.title}
                    </td>
                    <td className="py-3.5 px-5 text-slate-400">
                      {task.project?.name || 'Unknown Project'}
                    </td>
                    <td className="py-3.5 px-5">
                      {task.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-slate-700 font-bold text-slate-200 text-[10px] flex items-center justify-center">
                            {task.assignedTo.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <span>{task.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <Badge type="status" value={task.status} />
                    </td>
                    <td className="py-3.5 px-5">
                      <Badge type="priority" value={task.priority} />
                    </td>
                    <td className="py-3.5 px-5 text-slate-400">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
