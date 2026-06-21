import React, { useEffect, useState } from 'react'
import { useRecoilValue, useRecoilState } from 'recoil'
import { AiOutlinePlus } from 'react-icons/ai'
import { filteredTasksSelector } from '../../recoil/selectors/taskSelectors'
import { taskFilterAtom }        from '../../recoil/atoms/taskAtom'
import useTasks  from '../../hooks/useTasks'
import useAuth   from '../../hooks/useAuth'
import api       from '../../api/axios'
import TaskCard  from '../../components/task/TaskCard'
import TaskForm  from '../../components/task/TaskForm'
import TaskDetailModal from '../../components/task/TaskDetailModal'
import Modal     from '../../components/common/Modal'
import Button    from '../../components/common/Button'
import Spinner   from '../../components/common/Spinner'

const STATUS_OPTIONS   = ['', 'todo', 'in-progress', 'in-review', 'completed', 'blocked']
const PRIORITY_OPTIONS = ['', 'low', 'medium', 'high', 'critical']

const TasksPage = () => {
  const tasks               = useRecoilValue(filteredTasksSelector)
  const [filter, setFilter] = useRecoilState(taskFilterAtom)
  const { fetchTasks, createTask, loading, selectedTask, setSelectedTask } = useTasks()
  const { user }            = useAuth()
  const [isModalOpen, setIsModalOpen]       = useState(false)
  const [projects, setProjects]             = useState([])
  const [users, setUsers]                   = useState([])

  useEffect(() => {
    fetchTasks()
    if (user?.role !== 'member') {
      api.get('/projects')
        .then(({ data }) => setProjects(data.projects || []))
        .catch(() => {})
      api.get('/users')
        .then(({ data }) => setUsers(data.users || []))
        .catch(() => {})
    }
  }, [user]) // eslint-disable-line

  const handleCreate = async (data) => { await createTask(data); setIsModalOpen(false) }

  const pageTitle = user?.role === 'admin' ? 'All Tasks' : user?.role === 'manager' ? 'Project Tasks' : 'My Tasks'

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">{pageTitle}</h1>
        {user?.role !== 'member' && (
          <Button variant="primary" onClick={() => setIsModalOpen(true)} id="create-task-page-btn">
            <AiOutlinePlus size={18} /> New Task
          </Button>
        )}
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} onClick={setSelectedTask} />
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Task">
        <TaskForm onSubmit={handleCreate} loading={loading} onCancel={() => setIsModalOpen(false)} />
      </Modal>

      {/* Task Details Modal */}
      <TaskDetailModal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} />
    </div>
  )
}

export default TasksPage
