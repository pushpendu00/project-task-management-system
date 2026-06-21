import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { formatDate } from '../../utils/formatDate'

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
            {canEditProject && (
              <Button
                variant="secondary"
                onClick={() => setIsEditProjectOpen(true)}
                id="edit-project-btn"
              >
                <AiOutlineEdit size={18} /> Edit Project
              </Button>
            )}
            {canManageMembers && (
              <Button
                variant="secondary"
                onClick={() => setIsAddMemberOpen(true)}
                id="add-member-btn"
              >
                <AiOutlineUserAdd size={18} /> Manage Team
              </Button>
            )}
            {canCreateTask && (
              <Button
                variant="primary"
                onClick={() => setIsTaskModalOpen(true)}
                id="create-task-btn"
              >
                <AiOutlinePlus size={18} /> Add Task
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start flex-1 min-h-0">
        {/* Kanban Board / List View (Spans 3 cols) */}
        <div className="lg:col-span-3 min-h-0 space-y-4">
          <div className="flex justify-end">
            <div className="flex bg-dark-800 border border-slate-700/50 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('board')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${viewMode === 'board' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}
                type="button"
              >
                <AiOutlineAppstore size={14} /> Board View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}
                type="button"
              >
                <AiOutlineUnorderedList size={14} /> List View
              </button>
            </div>
          </div>

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
                        <td className="py-3.5 px-5 font-semibold text-white">
                          {task.title}
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
                <span className="block text-xs text-slate-500 font-semibold uppercase">Project Manager</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
                    {project.assignedManager?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm text-slate-200">{project.assignedManager?.name || 'Unassigned'}</span>
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
              <div className="mt-2 p-2 bg-primary-950/30 border border-primary-800/40 rounded-lg flex items-center justify-between text-xs text-slate-200 animate-fade-in">
                <span>Selected User: <strong className="text-white">{selectedUser.name}</strong> ({selectedUser.email})</span>
                <button type="button" onClick={() => { setSelectedUser(null); setSearchQuery('') }} className="text-slate-400 hover:text-red-400 font-bold px-1.5 transition-colors">✕</button>
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
                      className="p-2.5 text-xs text-slate-300 hover:bg-dark-900 cursor-pointer flex items-center gap-2 justify-between transition-colors"
                    >
                      <div>
                        <span className="font-semibold text-white">{u.name}</span>
                        <span className="text-slate-500 ml-2">({u.email})</span>
                      </div>
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
              <option value="member">Member</option>
              <option value="employee">Employee</option>
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
                    <div className="w-6 h-6 rounded-full bg-slate-700 text-slate-200 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                      {member.user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">{member.user?.name || 'Unknown'}</p>
                      <p className="text-[10px] text-slate-500 capitalize">{member.role}</p>
                    </div>
                  </div>
                  {canManageMembers && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.user?._id || member.user)}
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
    </div>
  )
}

export default ProjectDetailPage
