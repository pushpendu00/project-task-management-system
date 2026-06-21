import React from 'react'
import { useRecoilValue } from 'recoil'
import { tasksByStatusSelector } from '../../recoil/selectors/taskSelectors'
import TaskCard from './TaskCard'

const COLUMNS = [
  { key: 'todo',        label: 'To Do',       color: 'bg-slate-500'  },
  { key: 'in-progress', label: 'In Progress',  color: 'bg-blue-500'   },
  { key: 'in-review',   label: 'In Review',    color: 'bg-yellow-500' },
  { key: 'completed',   label: 'Completed',    color: 'bg-green-500'  },
  { key: 'blocked',     label: 'Blocked',      color: 'bg-red-500'    },
]

const KanbanBoard = ({ onTaskClick }) => {
  const tasksByStatus = useRecoilValue(tasksByStatusSelector)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUMNS.map(({ key, label, color }) => {
        const tasks = tasksByStatus[key] || []
        return (
          <div key={key} className="flex flex-col bg-dark-800/50 rounded-xl border border-slate-700/50 min-h-96">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-700/50">
              <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
              <span className="text-sm font-semibold text-slate-300">{label}</span>
              <span className="ml-auto bg-dark-700 text-slate-400 text-xs px-2 py-0.5 rounded-full">
                {tasks.length}
              </span>
            </div>
            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {tasks.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-slate-600 text-sm">No tasks</div>
              ) : (
                tasks.map((task) => <TaskCard key={task._id} task={task} onClick={onTaskClick} />)
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default KanbanBoard
