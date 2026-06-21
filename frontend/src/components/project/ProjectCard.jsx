import React from 'react'
import { Link } from 'react-router-dom'
import { AiOutlineCalendar, AiOutlineTeam } from 'react-icons/ai'
import Badge from '../common/Badge'
import { formatDate } from '../../utils/formatDate'

const ProjectCard = ({ project, onEdit, onDelete }) => (
  <div className="card p-5 hover:border-slate-600 transition-all duration-200 hover:shadow-xl
                  hover:shadow-primary-900/10 group animate-fade-in">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1 min-w-0">
        <Link to={`/projects/${project._id}`}
              className="text-base font-semibold text-white hover:text-primary-400 transition-colors line-clamp-1">
          {project.name}
        </Link>
        <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{project.description}</p>
      </div>
      <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit   && <button onClick={() => onEdit(project)}      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-700 text-xs">Edit</button>}
        {onDelete && <button onClick={() => onDelete(project._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-dark-700 text-xs">Delete</button>}
      </div>
    </div>
    <div className="flex gap-2 mb-4">
      <Badge type="status"   value={project.status}   />
      <Badge type="priority" value={project.priority} />
    </div>
    {/* Progress Bar */}
    <div className="mb-4 space-y-1.5">
      <div className="flex justify-between items-center text-xs font-semibold">
        <span className="text-slate-400">Completion</span>
        <span className="text-primary-400">{project.progress || 0}%</span>
      </div>
      <div className="w-full h-1.5 bg-dark-900 rounded-full overflow-hidden border border-slate-800">
        <div
          className="h-full bg-primary-500 rounded-full transition-all duration-500"
          style={{ width: `${project.progress || 0}%` }}
        />
      </div>
    </div>
    <div className="flex items-center justify-between text-xs text-slate-500">
      <div className="flex items-center gap-1">
        <AiOutlineTeam size={14} />
        <span>{project.members?.length || 0} members</span>
      </div>
      {project.endDate && (
        <div className="flex items-center gap-1">
          <AiOutlineCalendar size={14} />
          <span>{formatDate(project.endDate)}</span>
        </div>
      )}
    </div>
  </div>
)

export default ProjectCard
