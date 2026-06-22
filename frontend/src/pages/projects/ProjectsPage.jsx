import React, { useEffect, useState } from 'react'
import { useRecoilValue } from 'recoil'
import { Link } from 'react-router-dom'
import { AiOutlinePlus, AiOutlineSearch, AiOutlineAppstore, AiOutlineUnorderedList } from 'react-icons/ai'
import { projectsAtom } from '../../recoil/atoms/projectAtom'
import useProjects from '../../hooks/useProjects'
import useAuth     from '../../hooks/useAuth'
import ProjectCard from '../../components/project/ProjectCard'
import ProjectForm from '../../components/project/ProjectForm'
import Modal   from '../../components/common/Modal'
import Button  from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'
import Badge   from '../../components/common/Badge'
import { formatDate } from '../../utils/formatDate'
import ConfirmModal from '../../components/common/ConfirmModal'

const ProjectsPage = () => {
  const projects = useRecoilValue(projectsAtom)
  const { fetchProjects, createProject, updateProject, deleteProject, loading } = useProjects()
  const { user } = useAuth()
  const [isModalOpen,    setIsModalOpen]    = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [search,         setSearch]         = useState('')
  const [statusFilter,   setStatusFilter]   = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [sortOrder,      setSortOrder]      = useState('created-desc')
  const [viewMode,       setViewMode]       = useState(() => {
    return localStorage.getItem('projectsViewMode') || 'grid'
  })
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  useEffect(() => { fetchProjects() }, []) // eslint-disable-line

  const handleSetViewMode = (mode) => {
    setViewMode(mode)
    localStorage.setItem('projectsViewMode', mode)
  }

  const handleSubmit = async (data) => {
    if (editingProject) await updateProject(editingProject._id, data)
    else                await createProject(data)
    setIsModalOpen(false)
    setEditingProject(null)
  }

  const handleEdit = (project) => { setEditingProject(project); setIsModalOpen(true) }

  const handleDeleteClick = (id) => {
    setConfirmDeleteId(id)
  }

  const handleConfirmDelete = async () => {
    if (confirmDeleteId) {
      await deleteProject(confirmDeleteId)
      setConfirmDeleteId(null)
    }
  }

  const filtered = projects
    .filter((p) => {
      const term = search.toLowerCase()
      const matchesSearch =
        p.name.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.assignedManager?.name?.toLowerCase().includes(term)

      const matchesStatus = !statusFilter || p.status === statusFilter
      const matchesPriority = !priorityFilter || p.priority === priorityFilter

      return matchesSearch && matchesStatus && matchesPriority
    })
    .sort((a, b) => {
      if (sortOrder === 'created-asc') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      } else if (sortOrder === 'created-desc') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      } else if (sortOrder === 'progress-desc') {
        return (b.progress || 0) - (a.progress || 0)
      } else if (sortOrder === 'progress-asc') {
        return (a.progress || 0) - (b.progress || 0)
      } else if (sortOrder === 'end-date-asc') {
        if (!a.endDate) return 1
        if (!b.endDate) return -1
        return new Date(a.endDate) - new Date(b.endDate)
      } else if (sortOrder === 'end-date-desc') {
        if (!a.endDate) return 1
        if (!b.endDate) return -1
        return new Date(b.endDate) - new Date(a.endDate)
      }
      return 0
    })

  return (
    <div className="animate-fade-in flex flex-col min-h-0" style={{ height: 'calc(100vh - 7.5rem)' }}>
      <div className="page-header flex-shrink-0 mb-3">
        <h1 className="page-title">Projects</h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-dark-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => handleSetViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Grid View"
              aria-label="Grid View"
            >
              <AiOutlineAppstore size={16} />
            </button>
            <button
              onClick={() => handleSetViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="List View"
              aria-label="List View"
            >
              <AiOutlineUnorderedList size={16} />
            </button>
          </div>
          {user?.role === 'admin' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => { setEditingProject(null); setIsModalOpen(true) }}
              id="create-project-btn"
              className="px-2 py-1 text-[10px] sm:text-xs sm:px-3 sm:py-1.5 flex items-center gap-1 flex-shrink-0"
            >
              <AiOutlinePlus className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> New Project
            </Button>
          )}
        </div>
      </div>

      {/* Filter Rows */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 mb-4 flex-shrink-0">
        {/* Search bar */}
        <div className="w-full lg:max-w-xs xl:max-w-md">
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-dark-900 border border-slate-750/70 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 w-full"
            id="project-search"
          />
        </div>

        {/* Dropdowns & Actions row, with horizontal scrolling */}
        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto py-1 scrollbar-none flex-nowrap">
          <select
            className="bg-dark-900 border border-slate-750/70 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer flex-shrink-0"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            id="filter-status"
          >
            <option value="">All Statuses</option>
            {['planning', 'active', 'on-hold', 'completed', 'cancelled', 'archived'].map((s) => (
              <option key={s} value={s}>
                {s.replace(/-/g, ' ')}
              </option>
            ))}
          </select>

          <select
            className="bg-dark-900 border border-slate-750/70 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer flex-shrink-0"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            id="filter-priority"
          >
            <option value="">All Priorities</option>
            {['low', 'medium', 'high', 'critical'].map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)} Priority
              </option>
            ))}
          </select>

          <select
            className="bg-dark-900 border border-slate-750/70 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer flex-shrink-0"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            id="sort-projects"
          >
            <option value="created-desc">Date Created (Newest)</option>
            <option value="created-asc">Date Created (Oldest)</option>
            <option value="progress-asc">Progress (Ascending)</option>
            <option value="progress-desc">Progress (Descending)</option>
            <option value="end-date-asc">End Date (Ascending)</option>
            <option value="end-date-desc">End Date (Descending)</option>
          </select>

          {(statusFilter || priorityFilter || search || sortOrder !== 'created-desc') && (
            <button
              onClick={() => {
                setStatusFilter('')
                setPriorityFilter('')
                setSearch('')
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

      {loading && projects.length === 0 ? (
        <div className="flex justify-center py-16 flex-1"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-slate-500 flex-1">
          {search || statusFilter || priorityFilter ? 'No projects match your filters.' : 'No projects yet. Create one to get started!'}
        </div>
      ) : viewMode === 'list' ? (
        <div className="flex-1 min-h-0 overflow-auto border border-slate-700/50 bg-dark-800 rounded-xl shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-dark-800 z-10 border-b border-slate-700/50">
              <tr className="border-b border-slate-700/50 bg-dark-900/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Project Name</th>
                <th className="py-3 px-4">Manager</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Progress</th>
                <th className="py-3 px-4">End Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40 text-sm text-slate-300">
              {filtered.map((project) => {
                const isOwner = project.owner?._id === user?._id || project.owner === user?._id;
                const isAssignedPM = project.assignedManager?._id === user?._id || project.assignedManager === user?._id;
                const canEdit = user?.role === 'admin' || isOwner || isAssignedPM;
                const managerName = project.assignedManager?.name || project.assignedManager?.email || 'Unassigned';

                return (
                  <tr key={project._id} className="hover:bg-dark-700/30 transition-colors duration-150">
                    <td className="py-3.5 px-4 font-medium text-white max-w-xs">
                      <Link to={`/projects/${project._id}`} className="hover:text-primary-400 transition-colors block truncate font-semibold">
                        {project.name}
                      </Link>
                      {project.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-slate-400">{managerName}</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge type="status" value={project.status} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge type="priority" value={project.priority} />
                    </td>
                    <td className="py-3.5 px-4 w-40">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-dark-900 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-primary-500 rounded-full transition-all duration-500"
                            style={{ width: `${project.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-primary-400 whitespace-nowrap">
                          {project.progress || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400">
                      {project.endDate ? formatDate(project.endDate) : '—'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-right text-xs">
                      <div className="flex justify-end gap-2">
                        {canEdit && (
                          <button
                            onClick={() => handleEdit(project)}
                            className="px-2.5 py-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 text-slate-300 hover:text-white transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleDeleteClick(project._id)}
                            className="px-2.5 py-1.5 rounded-lg bg-dark-700 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-transparent hover:border-red-900/30 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
            {filtered.map((project) => {
              const isOwner = project.owner?._id === user?._id || project.owner === user?._id;
              const isAssignedPM = project.assignedManager?._id === user?._id || project.assignedManager === user?._id;
              const canEdit = user?.role === 'admin' || isOwner || isAssignedPM;
              return (
                <ProjectCard
                  key={project._id}
                  project={project}
                  onEdit={canEdit ? handleEdit : undefined}
                  onDelete={user?.role === 'admin' ? handleDeleteClick : undefined}
                />
              )
            })}
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingProject(null) }}
             title={editingProject ? 'Edit Project' : 'Create New Project'}>
        <ProjectForm initialData={editingProject || {}} onSubmit={handleSubmit}
                     loading={loading} onCancel={() => { setIsModalOpen(false); setEditingProject(null) }} />
      </Modal>

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Project"
        message="Are you sure you want to delete this project? All associated tasks, milestones, and discussions will be permanently deleted."
        confirmText="Delete Project"
        type="danger"
        loading={loading}
      />
    </div>
  )
}

export default ProjectsPage
