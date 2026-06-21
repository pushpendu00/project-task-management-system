import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useRecoilValue } from 'recoil'
import { AiOutlineProject, AiOutlineCheckSquare, AiOutlineClockCircle, AiOutlineArrowRight } from 'react-icons/ai'
import { authUserAtom }  from '../../recoil/atoms/authAtom'
import { projectsAtom }  from '../../recoil/atoms/projectAtom'
import { tasksAtom }     from '../../recoil/atoms/taskAtom'
import useProjects       from '../../hooks/useProjects'
import useTasks          from '../../hooks/useTasks'
import ProjectCard       from '../../components/project/ProjectCard'
import Spinner           from '../../components/common/Spinner'

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  </div>
)

const DashboardPage = () => {
  const user     = useRecoilValue(authUserAtom)
  const projects = useRecoilValue(projectsAtom)
  const tasks    = useRecoilValue(tasksAtom)
  const { fetchProjects, loading: projLoading } = useProjects()
  const { fetchTasks }                          = useTasks()

  useEffect(() => { fetchProjects(); fetchTasks() }, []) // eslint-disable-line

  const myTasks      = tasks.filter((t) => t.assignedTo?._id === user?._id)
  const doneTasks    = myTasks.filter((t) => t.status === 'done')
  const pendingTasks = myTasks.filter((t) => t.status !== 'done')

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-slate-400 text-sm mt-1">Here's what's happening today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard icon={AiOutlineProject}     label="Total Projects" value={projects.length}     color="bg-primary-600" />
        <StatCard icon={AiOutlineCheckSquare} label="My Tasks"       value={myTasks.length}      color="bg-blue-600"    />
        <StatCard icon={AiOutlineClockCircle} label="Pending"        value={pendingTasks.length} color="bg-orange-600"  />
        <StatCard icon={AiOutlineCheckSquare} label="Completed"      value={doneTasks.length}    color="bg-green-600"   />
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Projects</h2>
          <Link to="/projects" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
            View all <AiOutlineArrowRight size={14} />
          </Link>
        </div>
        {projLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : projects.length === 0 ? (
          <div className="card p-8 text-center text-slate-500">
            <p>No projects yet.</p>
            <Link to="/projects" className="text-primary-400 hover:underline text-sm mt-2 inline-block">
              Create your first project →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.slice(0, 6).map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
