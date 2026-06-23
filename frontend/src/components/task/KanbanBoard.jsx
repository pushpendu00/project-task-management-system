import React, { useState } from 'react'
import { useRecoilValue } from 'recoil'
import { tasksByStatusSelector } from '../../recoil/selectors/taskSelectors'
import TaskCard from './TaskCard'
import useTasks from '../../hooks/useTasks'
import toast from 'react-hot-toast'
import { FiList, FiPlay, FiEye, FiCheckCircle, FiAlertOctagon } from 'react-icons/fi'

const COLUMNS = [
  { key: 'todo',        label: 'To Do',       color: 'bg-cyan-600',   icon: FiList         },
  { key: 'in-progress', label: 'In Progress',  color: 'bg-amber-600',  icon: FiPlay         },
  { key: 'in-review',   label: 'In Review',    color: 'bg-indigo-600', icon: FiEye          },
  { key: 'completed',   label: 'Completed',    color: 'bg-green-600',  icon: FiCheckCircle  },
  { key: 'blocked',     label: 'Blocked',      color: 'bg-red-600',    icon: FiAlertOctagon },
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
    setDraggedOverCol(colKey)
    const taskId = e.dataTransfer.getData('text/plain')
    if (!taskId) return

    const isAlreadyInCol = tasksByStatus[colKey]?.some(t => t._id === taskId)
    if (isAlreadyInCol) {
      setDraggedOverCol(null)
      return
    }

    try {
      await updateTask(taskId, { status: colKey })
    } catch (error) {
      toast.error('Failed to move task')
    } finally {
      setDraggedOverCol(null)
    }
  }

  return (
    <div className="flex items-start gap-4 overflow-x-auto pb-4 w-full scrollbar-thin">
      {COLUMNS.map(({ key, label, color, icon: StatusIcon }) => {
        const tasks = tasksByStatus[key] || []
        const isHovered = draggedOverCol === key

        return (
          <div
            key={key}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, key)}
            className={`flex flex-col min-h-[500px] w-[290px] min-w-[290px] flex-shrink-0 transition-all duration-200 rounded-xl ${
              isHovered ? 'scale-[1.01] shadow-lg shadow-primary-950/20' : ''
            }`}
          >
            {/* Status Header */}
            <div className={`flex items-center justify-between px-3.5 py-2.5 rounded-t-xl text-white font-bold text-xs uppercase tracking-wider flex-shrink-0 shadow-sm ${color}`}>
              <div className="flex items-center gap-2 min-w-0">
                <StatusIcon size={14} className="flex-shrink-0" />
                <span className="truncate">{label}</span>
              </div>
              <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                {tasks.length}
              </span>
            </div>

            {/* Status Body */}
            <div className={`flex-1 p-2 space-y-2 overflow-y-auto max-h-[480px] bg-dark-800/25 rounded-b-xl border border-t-0 transition-colors duration-200 ${
              isHovered ? 'border-primary-500 bg-dark-800/40' : 'border-slate-700/40'
            }`}>
              <div className="flex items-center justify-between px-1.5 py-1 text-[10px] text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-800/40 mb-1 flex-shrink-0">
                <span className="flex items-center gap-1">
                  <FiList size={11} />
                  <span>Tasks</span>
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600/40" />
              </div>

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
