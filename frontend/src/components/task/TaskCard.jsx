import React from 'react'
import { AiOutlineCalendar, AiOutlineUser } from 'react-icons/ai'
import Badge from '../common/Badge'
import { formatDate } from '../../utils/formatDate'

const TaskCard = ({ task, onClick, onDragStart }) => (
  <div
    draggable
    onDragStart={(e) => onDragStart?.(e, task._id)}
    onClick={() => onClick?.(task)}
    className="card p-3 cursor-pointer hover:border-slate-600 transition-all duration-200
               hover:shadow-lg hover:shadow-primary-900/10 animate-fade-in group select-none"
    id={`task-card-${task._id}`}
  >
    <div className="flex items-start gap-2 mb-2">
      <Badge type="priority" value={task.priority} className="text-[10px] px-2 py-0.5" />
    </div>
    <p className="text-xs font-semibold text-slate-200 mb-1 line-clamp-2 group-hover:text-white leading-tight">
      {task.title}
    </p>
    {task.description && (
      <p className="text-[11px] text-slate-500 mb-2.5 line-clamp-1">{task.description}</p>
    )}
    <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-700/40">
      <div className="flex items-center gap-1 min-w-0 flex-1">
        {task.assignedTo ? (
          <>
            <div className="w-4 h-4 rounded-full bg-primary-700 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
              {task.assignedTo.name?.[0]?.toUpperCase()}
            </div>
            <span className="truncate text-slate-400 max-w-[60px] sm:max-w-[80px]" title={task.assignedTo.name}>
              {task.assignedTo.name}
            </span>
          </>
        ) : (
          <>
            <AiOutlineUser size={12} className="flex-shrink-0 text-slate-600" />
            <span className="truncate text-slate-600">Unassigned</span>
          </>
        )}
      </div>
      {task.dueDate && (
        <div className="flex items-center gap-0.5 text-slate-500 flex-shrink-0">
          <AiOutlineCalendar size={11} className="flex-shrink-0" />
          <span className="whitespace-nowrap">{formatDate(task.dueDate)}</span>
        </div>
      )}
    </div>
  </div>
)

export default TaskCard
