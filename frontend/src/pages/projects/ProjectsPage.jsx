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

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-dark-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => handleSetViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Grid View"
              aria-label="Grid View"
            >
              <AiOutlineAppstore size={20} />
            </button>
            <button
              onClick={() => handleSetViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="List View"
              aria-label="List View"
            >
              <AiOutlineUnorderedList size={20} />
            </button>
          </div>
          {user?.role === 'admin' && (
            <Button variant="primary" onClick={() => { setEditingProject(null); setIsModalOpen(true) }} id="create-project-btn">
              <AiOutlinePlus size={18} /> New Project
            </Button>
          )}
        </div>
      </div>

      <div className="relative mb-6 max-w-sm">
        <AiOutlineSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input id="project-search" type="text" placeholder="Search projects..."
               value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9" />
      </div>

      {loading && projects.length === 0 ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          {search ? 'No projects match your search.' : 'No projects yet. Create one to get started!'}
        </div>
      ) : viewMode === 'list' ? (
        <div className="overflow-x-auto w-full border border-slate-700/50 bg-dark-800 rounded-xl shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
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
                        <span className="block text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {project.description}
                        </span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
