import React from 'react'
import { AiOutlineCalendar, AiOutlineUser } from 'react-icons/ai'
import Badge from '../common/Badge'
import { formatDate } from '../../utils/formatDate'

const TaskCard = ({ task, onClick, onDragStart }) => (
  <div
    draggable
    onDragStart={(e) => onDragStart?.(e, task._id)}
    onClick={() => onClick?.(task)}
    className="card p-4 cursor-pointer hover:border-slate-600 transition-all duration-200
               hover:shadow-lg hover:shadow-primary-900/10 animate-fade-in group select-none"
    id={`task-card-${task._id}`}
  >
    <div className="flex items-start gap-2 mb-2">
      <Badge type="priority" value={task.priority} />
    </div>
    <p className="text-sm font-medium text-slate-100 mb-1 line-clamp-2 group-hover:text-white">
      {task.title}
    </p>
    {task.description && (
      <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.description}</p>
    )}
    <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
      <div className="flex items-center gap-1.5">
        {task.assignedTo ? (
          <>
            <div className="w-5 h-5 rounded-full bg-primary-700 flex items-center justify-center text-white text-xs font-bold">
              {task.assignedTo.name?.[0]?.toUpperCase()}
            </div>
            <span className="truncate max-w-20">{task.assignedTo.name}</span>
          </>
        ) : (
          <><AiOutlineUser size={14} /><span>Unassigned</span></>
        )}
      </div>
      {task.dueDate && (
        <div className="flex items-center gap-1">
          <AiOutlineCalendar size={12} />
          <span>{formatDate(task.dueDate)}</span>
        </div>
      )}
    </div>
  </div>
)

export default TaskCard
