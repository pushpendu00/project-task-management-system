import React, { useEffect, useState } from 'react'
import { useRecoilValue } from 'recoil'
import { AiOutlinePlus, AiOutlineSearch } from 'react-icons/ai'
import { projectsAtom } from '../../recoil/atoms/projectAtom'
import useProjects from '../../hooks/useProjects'
import useAuth     from '../../hooks/useAuth'
import ProjectCard from '../../components/project/ProjectCard'
import ProjectForm from '../../components/project/ProjectForm'
import Modal   from '../../components/common/Modal'
import Button  from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'

const ProjectsPage = () => {
  const projects = useRecoilValue(projectsAtom)
  const { fetchProjects, createProject, updateProject, deleteProject, loading } = useProjects()
  const { user } = useAuth()
  const [isModalOpen,    setIsModalOpen]    = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [search,         setSearch]         = useState('')

  useEffect(() => { fetchProjects() }, []) // eslint-disable-line

  const handleSubmit = async (data) => {
    if (editingProject) await updateProject(editingProject._id, data)
    else                await createProject(data)
    setIsModalOpen(false)
    setEditingProject(null)
  }

  const handleEdit = (project) => { setEditingProject(project); setIsModalOpen(true) }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this project?')) await deleteProject(id)
  }

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
        {user?.role === 'admin' && (
          <Button variant="primary" onClick={() => { setEditingProject(null); setIsModalOpen(true) }} id="create-project-btn">
            <AiOutlinePlus size={18} /> New Project
          </Button>
        )}
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
                onDelete={user?.role === 'admin' ? handleDelete : undefined}
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
    </div>
  )
}

export default ProjectsPage
