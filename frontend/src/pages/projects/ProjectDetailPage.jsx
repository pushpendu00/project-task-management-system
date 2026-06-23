import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useRecoilValue } from 'recoil'
import {
  AiOutlinePlus, AiOutlineArrowLeft, AiOutlineUser,
  AiOutlineUserAdd, AiOutlineCloseCircle, AiOutlineSearch,
  AiOutlineEdit, AiOutlineAppstore, AiOutlineUnorderedList
} from 'react-icons/ai'
import { selectedProjectAtom } from '../../recoil/atoms/projectAtom'
import useProjects from '../../hooks/useProjects'
import useTasks from '../../hooks/useTasks'
import useAuth from '../../hooks/useAuth'
import KanbanBoard from '../../components/task/KanbanBoard'
import TaskForm from '../../components/task/TaskForm'
import ProjectForm from '../../components/project/ProjectForm'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Spinner from '../../components/common/Spinner'
import Select from '../../components/common/Select'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { formatDate } from '../../utils/formatDate'
import ConfirmModal from '../../components/common/ConfirmModal'
import { getInitials } from '../../utils/getInitials'

const getAvatarUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  const host = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase
  return `${host}${path}`
}

const ProjectDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const project = useRecoilValue(selectedProjectAtom)
  const { user } = useAuth()
  const { fetchProjectById, updateProject, addMember, removeMember, loading: projLoading } = useProjects()
  const { tasks, fetchTasks, createTask, loading: taskLoading, selectedTask, setSelectedTask } = useTasks()

  const handleTaskClick = (task) => {
    navigate(`/tasks/${task._id}`)
  }

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false)
  const [viewMode, setViewMode] = useState('board')
  const [confirmRemoveMemberId, setConfirmRemoveMemberId] = useState(null)

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
    setSelectedUser(null)
    setMemberRole('developer')
    setSearchQuery('')
  }

  const handleRemoveMemberClick = (userId) => {
    setConfirmRemoveMemberId(userId)
  }

  const handleConfirmRemoveMember = async () => {
    if (confirmRemoveMemberId) {
      await removeMember(id, confirmRemoveMemberId)
      setConfirmRemoveMemberId(null)
    }
  }

  if (projLoading && !project) {
    return <div className="flex justify-center py-24"><Spinner size="lg" /></div>
  }
  if (!project) return null

  // User permission check
  const isOwner = project.owner?._id === user?._id || project.owner === user?._id;
  const isAssignedPM = project.assignedManager?._id === user?._id || project.assignedManager === user?._id;
  const isTeamManager = project.members?.some((m) => (m.user?._id || m.user) === user?._id && m.role === 'manager');

  const isOwnerOrAdmin = user?.role === 'admin' || isOwner;
  const canManageMembers = isOwnerOrAdmin || isAssignedPM || isTeamManager;
  const canCreateTask = user?.role === 'admin' || isOwner || isAssignedPM || isTeamManager;
  const canEditProject = user?.role === 'admin' || isOwner || isAssignedPM;

  const handleEditProjectSubmit = async (data) => {
    await updateProject(id, data)
    setIsEditProjectOpen(false)
  }

  // Filter out existing members
  const availableUsers = allUsers.filter((u) => {
    const ownerId = (project.owner?._id || project.owner || '').toString()
    if (u._id.toString() === ownerId) return false

    return !project.members?.some((m) => {
      const memberId = (m.user?._id || m.user || '').toString()
      return memberId === u._id.toString()
    })
  })

  const searchedUsers = availableUsers.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery?.toLowerCase())
  )

  return (
    <div className="animate-fade-in flex flex-col min-h-0">
      {/* Compact Header */}
      <div className="mb-4 flex-shrink-0 bg-dark-800/40 border border-slate-700/40 rounded-xl p-3 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Navigation, Title & Details */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-0.5">
                <Link to="/projects" className="hover:text-primary-400 transition-colors font-semibold">
                  Projects
                </Link>
                <span>/</span>
                <span className="truncate max-w-[120px] text-slate-400 font-medium">{project.name}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold text-slate-100 tracking-tight truncate">
                  {project.name}
                </h1>
                <Badge type="status" value={project.status} className="text-[10px] px-2 py-0.5" />
                <Badge type="priority" value={project.priority} className="text-[10px] px-2 py-0.5" />
              </div>
              {project.description && (
                <p className="text-slate-400 text-xs truncate max-w-xl mt-0.5">
                  {project.description}
                </p>
              )}
            </div>
          </div>

          {/* Right: Toggle & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex bg-dark-900 border border-slate-700/50 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('board')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${viewMode === 'board' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-slate-100'}`}
                type="button"
              >
                <AiOutlineAppstore size={14} /> Board
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-slate-100'}`}
                type="button"
              >
                <AiOutlineUnorderedList size={14} /> List
              </button>
            </div>

            <div className="hidden sm:block h-4 w-px bg-slate-700/60" />

            <div className="flex gap-2">
              {canEditProject && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditProjectOpen(true)}
                  className="text-xs px-2.5 py-1.5 flex items-center gap-1"
                  id="edit-project-btn"
                >
                  <AiOutlineEdit size={14} /> Settings
                </Button>
              )}
              {canManageMembers && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAddMemberOpen(true)}
                  className="text-xs px-2.5 py-1.5 flex items-center gap-1"
                  id="add-member-btn"
                >
                  <AiOutlineUserAdd size={14} /> Team
                </Button>
              )}
              {canCreateTask && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsTaskModalOpen(true)}
                  className="text-xs px-2.5 py-1.5 flex items-center gap-1"
                  id="create-task-btn"
                >
                  <AiOutlinePlus size={14} /> Add Task
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start flex-1 min-h-0">
        {/* Kanban Board / List View (Spans 4 cols) */}
        <div className="lg:col-span-4 min-h-0">
          {taskLoading ? (
            <div className="flex justify-center py-24"><Spinner size="lg" /></div>
          ) : viewMode === 'board' ? (
            <KanbanBoard onTaskClick={handleTaskClick} />
          ) : tasks.length === 0 ? (
            <div className="card p-12 text-center text-slate-500 font-medium">No tasks created for this project yet.</div>
          ) : (
            <div className="card overflow-hidden border border-slate-700/50 animate-fade-in">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-dark-800 border-b border-slate-700 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3 px-5">Task Title</th>
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
                        onClick={() => handleTaskClick(task)}
                        className="hover:bg-dark-800/20 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-5 font-semibold text-slate-100">
                          {task.title}
                        </td>
                        <td className="py-3.5 px-5">
                          {task.assignedTo ? (
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-slate-700 font-bold text-slate-200 text-[10px] flex items-center justify-center overflow-hidden flex-shrink-0">
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
        </div>

        {/* Sidebar Project Info (Spans 1 col) */}
        <div className="lg:col-span-1 space-y-4">
          {/* Project Details Panel */}
          <div className="card p-3.5 space-y-3.5 shadow-md">
            <h3 className="text-xs font-bold text-slate-100 border-b border-slate-700/50 pb-1.5 uppercase tracking-wider">
              Project Settings
            </h3>
            <div className="space-y-3">
              <div>
                <span className="block text-[10px] text-slate-500 font-semibold uppercase">Project Owner</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-5 h-5 rounded-full bg-primary-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {project.owner?.avatar ? (
                      <img
                        src={getAvatarUrl(project.owner.avatar)}
                        alt={project.owner.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(project.owner?.name)
                    )}
                  </div>
                  <span className="text-xs text-slate-200 truncate">{project.owner?.name}</span>
                </div>
              </div>

              <div>
                <span className="block text-[10px] text-slate-500 font-semibold uppercase">Project Manager</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {project.assignedManager?.avatar ? (
                      <img
                        src={getAvatarUrl(project.assignedManager.avatar)}
                        alt={project.assignedManager.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(project.assignedManager?.name) || 'U'
                    )}
                  </div>
                  <span className="text-xs text-slate-200 truncate">{project.assignedManager?.name || 'Unassigned'}</span>
                </div>
              </div>

              <div>
                <span className="block text-[10px] text-slate-500 font-semibold uppercase">Dates</span>
                <p className="text-xs text-slate-300 mt-0.5 font-medium">
                  {project.startDate ? formatDate(project.startDate) : 'N/A'} —{' '}
                  {project.endDate ? formatDate(project.endDate) : 'N/A'}
                </p>
              </div>

              <div>
                <span className="block text-[10px] text-slate-500 font-semibold uppercase mb-1">Project Progress</span>
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-semibold">
                    <span className="text-slate-400">Completion</span>
                    <span className="text-primary-400 font-bold">{project.progress || 0}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-dark-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all duration-500"
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {project.tags && project.tags.length > 0 && (
                <div>
                  <span className="block text-[10px] text-slate-500 font-semibold uppercase mb-1">Tags</span>
                  <div className="flex flex-wrap gap-1">
                    {project.tags.map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] bg-slate-850 text-slate-400 border border-slate-700/30">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Project Team Members Panel */}
          <div className="card p-3.5 space-y-3.5 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-700/50 pb-1.5">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Team Members ({project.members?.length || 0})
              </h3>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {project.members && project.members.length > 0 ? (
                project.members.map((member) => (
                  <div key={member.user?._id} className="flex items-center justify-between gap-1.5 p-1 rounded-lg hover:bg-dark-800/40 transition-colors">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-slate-700 text-slate-200 font-bold text-[10px] flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {member.user?.avatar ? (
                          <img
                            src={getAvatarUrl(member.user.avatar)}
                            alt={member.user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getInitials(member.user?.name)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate leading-tight">{member.user?.name}</p>
                        <p className="text-[9px] text-slate-500 capitalize leading-none">{member.role}</p>
                      </div>
                    </div>
                    {canManageMembers && (
                      <button
                        onClick={() => handleRemoveMemberClick(member.user?._id)}
                        className="text-slate-500 hover:text-red-600 dark:hover:text-red-400 p-0.5 transition-colors flex-shrink-0"
                        title="Remove member"
                      >
                        <AiOutlineCloseCircle size={14} />
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

            {selectedUser && (
              <div className="mt-2 p-2 bg-primary-950/30 border border-primary-800/40 rounded-lg flex items-center gap-2.5 text-xs text-slate-200 animate-fade-in">
                <div className="w-6 h-6 rounded-full bg-slate-700 font-bold text-slate-200 text-[10px] flex items-center justify-center overflow-hidden flex-shrink-0 mr-0.5 border border-slate-650/40">
                  {selectedUser.avatar ? (
                    <img
                      src={getAvatarUrl(selectedUser.avatar)}
                      alt={selectedUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(selectedUser.name) || 'U'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-slate-100 block truncate">{selectedUser.name}</span>
                  <span className="text-slate-500 block text-[10px] truncate">{selectedUser.email}</span>
                </div>
                <button type="button" onClick={() => { setSelectedUser(null); setSearchQuery('') }} className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 font-bold px-1.5 transition-colors">✕</button>
              </div>
            )}

            {/* User Search Results dropdown */}
            {!selectedUser && (
              <div className="mt-2 border border-slate-700 bg-dark-800 rounded-lg max-h-40 overflow-y-auto divide-y divide-slate-700/50">
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
                        setSearchQuery('')
                      }}
                      className="p-2 py-2.5 text-xs text-slate-300 hover:bg-dark-900 cursor-pointer flex items-center gap-2.5 transition-colors"
                    >
                      <div className="w-5 h-5 rounded-full bg-slate-700 font-bold text-slate-200 text-[10px] flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-750/30">
                        {u.avatar ? (
                          <img
                            src={getAvatarUrl(u.avatar)}
                            alt={u.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getInitials(u.name) || 'U'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-slate-100 block truncate">{u.name}</span>
                        <span className="text-slate-500 text-[10px] block truncate">{u.email}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <Select
              label="Project Role"
              value={memberRole}
              onChange={(e) => setMemberRole(e.target.value)}
              className="w-full"
              buttonClassName="py-2.5 px-3 bg-dark-900 border border-slate-750/70 rounded-lg text-slate-200 text-xs w-full text-left"
            >
              <option value="developer">Developer</option>
              <option value="manager">Manager</option>
              <option value="designer">Designer</option>
              <option value="tester">Tester</option>
              <option value="viewer">Viewer</option>
              <option value="member">Member</option>
              <option value="employee">Employee</option>
            </Select>
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
              Done / Close
            </Button>
            <Button type="submit" variant="primary" loading={projLoading}>
              Add to Team
            </Button>
          </div>
        </form>

        {/* Current Team Members List */}
        <div className="border-t border-slate-700/50 pt-4 mt-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Current Team Members ({project.members?.length || 0})
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {project.members && project.members.length > 0 ? (
              project.members.map((member) => (
                <div key={member.user?._id || member.user} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-dark-900 border border-slate-800 text-left">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-slate-700 text-slate-200 font-bold text-[10px] flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {member.user?.avatar ? (
                        <img
                          src={getAvatarUrl(member.user.avatar)}
                          alt={member.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getInitials(member.user?.name) || 'U'
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">{member.user?.name || 'Unknown'}</p>
                      <p className="text-[10px] text-slate-500 capitalize">{member.role}</p>
                    </div>
                  </div>
                  {canManageMembers && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMemberClick(member.user?._id || member.user)}
                      className="text-slate-500 hover:text-red-600 dark:hover:text-red-400 p-1 transition-colors"
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
      </Modal>

      {/* Edit Project Modal */}
      <Modal isOpen={isEditProjectOpen} onClose={() => setIsEditProjectOpen(false)} title="Edit Project">
        <ProjectForm
          initialData={project}
          onSubmit={handleEditProjectSubmit}
          loading={projLoading}
          onCancel={() => setIsEditProjectOpen(false)}
        />
      </Modal>

      <ConfirmModal
        isOpen={!!confirmRemoveMemberId}
        onClose={() => setConfirmRemoveMemberId(null)}
        onConfirm={handleConfirmRemoveMember}
        title="Remove Member"
        message="Are you sure you want to remove this member from the project? They will lose access to all tasks and discussion boards in this project."
        confirmText="Remove Member"
        type="danger"
        loading={projLoading}
      />
    </div>
  )
}

export default ProjectDetailPage
