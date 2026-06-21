import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useRecoilValue } from 'recoil'
import {
  AiOutlinePlus, AiOutlineArrowLeft, AiOutlineUser,
  AiOutlineUserAdd, AiOutlineCloseCircle, AiOutlineSearch
} from 'react-icons/ai'
import { selectedProjectAtom } from '../../recoil/atoms/projectAtom'
import useProjects from '../../hooks/useProjects'
import useTasks from '../../hooks/useTasks'
import useAuth from '../../hooks/useAuth'
import KanbanBoard from '../../components/task/KanbanBoard'
import TaskForm from '../../components/task/TaskForm'
import TaskDetailModal from '../../components/task/TaskDetailModal'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Spinner from '../../components/common/Spinner'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const ProjectDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const project = useRecoilValue(selectedProjectAtom)
  const { user } = useAuth()
  const { fetchProjectById, addMember, removeMember, loading: projLoading } = useProjects()
  const { fetchTasks, createTask, loading: taskLoading, selectedTask, setSelectedTask } = useTasks()

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)

  // Add Member state
  const [allUsers, setAllUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [memberRole, setMemberRole] = useState('developer')
  const [memberLoading, setMemberLoading] = useState(false)

  useEffect(() => {
    fetchProjectById(id)
    fetchTasks({ project: id })
  }, [id]) // eslint-disable-line

  useEffect(() => {
    if (isAddMemberOpen) {
      setMemberLoading(true)
      api.get('/users')
        .then(({ data }) => {
          setAllUsers(data.users || [])
        })
        .catch(() => {
          toast.error('Failed to load users list')
        })
        .finally(() => {
          setMemberLoading(false)
        })
    }
  }, [isAddMemberOpen])

  const handleCreateTask = async (data) => {
    await createTask({ ...data, project: id })
    setIsTaskModalOpen(false)
  }

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault()
    if (!selectedUser) {
      toast.error('Please select a user first')
      return
    }
    await addMember(id, { userId: selectedUser._id, role: memberRole })
    setIsAddMemberOpen(false)
    setSelectedUser(null)
    setMemberRole('developer')
    setSearchQuery('')
  }

  const handleRemoveMember = async (userId) => {
    if (window.confirm('Remove this member from the project?')) {
      await removeMember(id, userId)
    }
  }

  if (projLoading && !project) {
    return <div className="flex justify-center py-24"><Spinner size="lg" /></div>
  }
  if (!project) return null

  // User permission check
  const isOwnerOrAdmin = user?._id === project.owner?._id || user?.role === 'admin'
  const isManager = project.members?.some((m) => m.user?._id === user?._id && m.role === 'manager')
  const canManageMembers = isOwnerOrAdmin || isManager

  // Filter out existing members
  const availableUsers = allUsers.filter(
    (u) =>
      u._id !== project.owner?._id &&
      !project.members?.some((m) => m.user?._id === u._id)
  )

  const searchedUsers = availableUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="animate-fade-in flex flex-col min-h-screen">
      {/* Header */}
      <div className="mb-6 flex-shrink-0">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-3 transition-colors"
          id="back-to-projects-btn"
        >
          <AiOutlineArrowLeft size={16} /> Back to Projects
        </button>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="page-title text-3xl font-extrabold tracking-tight text-white mb-1">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-slate-400 text-sm max-w-2xl">{project.description}</p>
            )}
            <div className="flex gap-2 mt-3">
              <Badge type="status" value={project.status} />
              <Badge type="priority" value={project.priority} />
            </div>
          </div>
          <div className="flex gap-3">
            {canManageMembers && (
              <Button
                variant="secondary"
                onClick={() => setIsAddMemberOpen(true)}
                id="add-member-btn"
              >
                <AiOutlineUserAdd size={18} /> Manage Team
              </Button>
            )}
            <Button
              variant="primary"
              onClick={() => setIsTaskModalOpen(true)}
              id="create-task-btn"
            >
              <AiOutlinePlus size={18} /> Add Task
            </Button>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start flex-1 min-h-0">
        {/* Kanban Board (Spans 3 cols) */}
        <div className="lg:col-span-3 min-h-0">
          {taskLoading ? (
            <div className="flex justify-center py-24"><Spinner size="lg" /></div>
          ) : (
            <KanbanBoard onTaskClick={setSelectedTask} />
          )}
        </div>

        {/* Sidebar Project Info (Spans 1 col) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Project Details Panel */}
          <div className="card p-5 space-y-5">
            <h3 className="text-sm font-bold text-white border-b border-slate-700/50 pb-2 uppercase tracking-wider">
              Project Settings
            </h3>
            <div className="space-y-4">
              <div>
                <span className="block text-xs text-slate-500 font-semibold uppercase">Project Owner</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-6 h-6 rounded-full bg-primary-600 text-white font-bold text-xs flex items-center justify-center">
                    {project.owner?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-slate-200">{project.owner?.name}</span>
                </div>
              </div>

              <div>
                <span className="block text-xs text-slate-500 font-semibold uppercase">Dates</span>
                <p className="text-sm text-slate-300 mt-1">
                  {project.startDate ? formatDate(project.startDate) : 'N/A'} —{' '}
                  {project.endDate ? formatDate(project.endDate) : 'N/A'}
                </p>
              </div>

              {project.tags && project.tags.length > 0 && (
                <div>
                  <span className="block text-xs text-slate-500 font-semibold uppercase mb-1">Tags</span>
                  <div className="flex flex-wrap gap-1">
                    {project.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700/30">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Project Team Members Panel */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Team Members ({project.members?.length || 0})
              </h3>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {project.members && project.members.length > 0 ? (
                project.members.map((member) => (
                  <div key={member.user?._id} className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-dark-800/40 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {member.user?.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">{member.user?.name}</p>
                        <p className="text-[10px] text-slate-500 capitalize">{member.role}</p>
                      </div>
                    </div>
                    {canManageMembers && (
                      <button
                        onClick={() => handleRemoveMember(member.user?._id)}
                        className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                        title="Remove member"
                      >
                        <AiOutlineCloseCircle size={16} />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No members assigned yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="Add New Task">
        <TaskForm
          projectId={id}
          members={project.members || []}
          onSubmit={handleCreateTask}
          loading={taskLoading}
          onCancel={() => setIsTaskModalOpen(false)}
        />
      </Modal>

      {/* Task Detail Modal */}
      <TaskDetailModal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} />

      {/* Add / Manage Member Modal */}
      <Modal isOpen={isAddMemberOpen} onClose={() => setIsAddMemberOpen(false)} title="Manage Project Team">
        <form onSubmit={handleAddMemberSubmit} className="space-y-4">
          <div>
            <label className="label">Search User</label>
            <div className="relative">
              <AiOutlineSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSelectedUser(null)
                }}
                className="input pl-9 text-sm"
              />
            </div>

            {/* User Search Results dropdown */}
            {searchQuery && (
              <div className="mt-1 border border-slate-700 bg-dark-800 rounded-lg max-h-40 overflow-y-auto divide-y divide-slate-700/50">
                {memberLoading ? (
                  <div className="p-3 text-xs text-slate-500 flex justify-center"><Spinner size="sm" /></div>
                ) : searchedUsers.length === 0 ? (
                  <div className="p-3 text-xs text-slate-500 italic text-center">No matching users found</div>
                ) : (
                  searchedUsers.map((u) => (
                    <div
                      key={u._id}
                      onClick={() => {
                        setSelectedUser(u)
                        setSearchQuery(`${u.name} (${u.email})`)
                      }}
                      className="p-2.5 text-xs text-slate-300 hover:bg-dark-900 cursor-pointer flex items-center gap-2 justify-between"
                    >
                      <div>
                        <span className="font-semibold text-white">{u.name}</span>
                        <span className="text-slate-500 ml-2">({u.email})</span>
                      </div>
                      {selectedUser?._id === u._id && (
                        <span className="text-primary-400 font-bold">Selected</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <label className="label">Project Role</label>
            <select
              value={memberRole}
              onChange={(e) => setMemberRole(e.target.value)}
              className="input text-sm"
            >
              <option value="developer">Developer</option>
              <option value="manager">Manager</option>
              <option value="designer">Designer</option>
              <option value="tester">Tester</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsAddMemberOpen(false)
                setSelectedUser(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={projLoading}>
              Add to Team
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default ProjectDetailPage
