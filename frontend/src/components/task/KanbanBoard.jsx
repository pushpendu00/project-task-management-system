import React, { useState } from 'react'
import { useRecoilValue } from 'recoil'
import { tasksByStatusSelector } from '../../recoil/selectors/taskSelectors'
import TaskCard from './TaskCard'
import useTasks from '../../hooks/useTasks'
import toast from 'react-hot-toast'

const COLUMNS = [
  { key: 'todo',        label: 'To Do',       color: 'bg-slate-500'  },
  { key: 'in-progress', label: 'In Progress',  color: 'bg-blue-500'   },
  { key: 'in-review',   label: 'In Review',    color: 'bg-yellow-500' },
  { key: 'completed',   label: 'Completed',    color: 'bg-green-500'  },
  { key: 'blocked',     label: 'Blocked',      color: 'bg-red-500'    },
]

const KanbanBoard = ({ onTaskClick }) => {
  const tasksByStatus = useRecoilValue(tasksByStatusSelector)
  const { updateTask } = useTasks()
  const [draggedOverCol, setDraggedOverCol] = useState(null)

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDragEnter = (e, colKey) => {
    e.preventDefault()
    setDraggedOverCol(colKey)
  }

  const handleDragLeave = () => {
    setDraggedOverCol(null)
  }

  const handleDrop = async (e, colKey) => {
    e.preventDefault()
    setDraggedOverCol(null)
    const taskId = e.dataTransfer.getData('text/plain')
    if (!taskId) return

    try {
      await updateTask(taskId, { status: colKey })
    } catch (error) {
      toast.error('Failed to move task')
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
      {COLUMNS.map(({ key, label, color }) => {
        const tasks = tasksByStatus[key] || []
        const isHovered = draggedOverCol === key

        return (
          <div
            key={key}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, key)}
            className={`flex flex-col rounded-xl border min-h-[450px] transition-all duration-200 ${
              isHovered
                ? 'bg-dark-850/80 border-primary-500 shadow-xl shadow-primary-900/5 scale-[1.01]'
                : 'bg-dark-800/50 border-slate-700/50'
            }`}
          >
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-700/50 flex-shrink-0">
              <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
              <span className="text-sm font-semibold text-slate-300">{label}</span>
              <span className="ml-auto bg-dark-700 text-slate-400 text-xs px-2 py-0.5 rounded-full">
                {tasks.length}
              </span>
            </div>
            <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[500px]">
              {tasks.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-slate-600 text-xs italic">
                  Drop tasks here
                </div>
              ) : (
                tasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onClick={onTaskClick}
                    onDragStart={handleDragStart}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default KanbanBoard
