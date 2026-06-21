import { useRecoilState } from 'recoil'
import toast from 'react-hot-toast'
import { projectsAtom, selectedProjectAtom, projectsLoadingAtom } from '../recoil/atoms/projectAtom'
import {
  getProjectsApi, getProjectByIdApi, createProjectApi,
  updateProjectApi, deleteProjectApi, addMemberApi, removeMemberApi,
} from '../api/project.api'

const useProjects = () => {
  const [projects,        setProjects]        = useRecoilState(projectsAtom)
  const [selectedProject, setSelectedProject] = useRecoilState(selectedProjectAtom)
  const [loading,         setLoading]         = useRecoilState(projectsLoadingAtom)

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const { data } = await getProjectsApi()
      setProjects(data.projects)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch projects')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjectById = async (id) => {
    try {
      setLoading(true)
      const { data } = await getProjectByIdApi(id)
      setSelectedProject(data.project)
      return data.project
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch project')
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (projectData) => {
    try {
      setLoading(true)
      const { data } = await createProjectApi(projectData)
      setProjects((prev) => [data.project, ...prev])
      toast.success('Project created successfully!')
      return data.project
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  const updateProject = async (id, projectData) => {
    try {
      setLoading(true)
      const { data } = await updateProjectApi(id, projectData)
      setProjects((prev) => prev.map((p) => (p._id === id ? data.project : p)))
      if (selectedProject?._id === id) setSelectedProject(data.project)
      toast.success('Project updated successfully!')
      return data.project
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update project')
    } finally {
      setLoading(false)
    }
  }

  const deleteProject = async (id) => {
    try {
      await deleteProjectApi(id)
      setProjects((prev) => prev.filter((p) => p._id !== id))
      toast.success('Project deleted successfully!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete project')
    }
  }

  const addMember = async (projectId, memberData) => {
    try {
      setLoading(true)
      const { data } = await addMemberApi(projectId, memberData)
      if (selectedProject?._id === projectId) setSelectedProject(data.project)
      setProjects((prev) => prev.map((p) => (p._id === projectId ? data.project : p)))
      toast.success('Member added successfully!')
      return data.project
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add member')
    } finally {
      setLoading(false)
    }
  }

  const removeMember = async (projectId, userId) => {
    try {
      setLoading(true)
      await removeMemberApi(projectId, userId)
      if (selectedProject?._id === projectId) {
        const updatedMembers = selectedProject.members.filter((m) => m.user?._id !== userId)
        const updatedProj = { ...selectedProject, members: updatedMembers }
        setSelectedProject(updatedProj)
        setProjects((prev) => prev.map((p) => (p._id === projectId ? updatedProj : p)))
      }
      toast.success('Member removed successfully!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove member')
    } finally {
      setLoading(false)
    }
  }

  return {
    projects, selectedProject, loading,
    fetchProjects, fetchProjectById, createProject, updateProject, deleteProject, setSelectedProject,
    addMember, removeMember,
  }
}

export default useProjects
