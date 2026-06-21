import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRecoilState, useRecoilValue } from 'recoil'
import {
  AiOutlineClose, AiOutlineCalendar, AiOutlineClockCircle,
  AiOutlineUser, AiOutlineDelete, AiOutlineMessage, AiOutlineEdit
} from 'react-icons/ai'
import { selectedTaskAtom } from '../../recoil/atoms/taskAtom'
import { selectedProjectAtom } from '../../recoil/atoms/projectAtom'
import useTasks from '../../hooks/useTasks'
import Badge from '../common/Badge'
import Spinner from '../common/Spinner'
import Button from '../common/Button'
import { formatDate, formatRelativeTime } from '../../utils/formatDate'

const TaskDetailModal = ({ isOpen, onClose }) => {
  const [selectedTask, setSelectedTask] = useRecoilState(selectedTaskAtom)
  const selectedProject = useRecoilValue(selectedProjectAtom)
  const { fetchTaskById, updateTask, deleteTask, addComment, loading } = useTasks()

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedDesc, setEditedDesc] = useState('')
  const [newComment, setNewComment] = useState('')
  const [addingComment, setAddingComment] = useState(false)

  // Fetch full task details (including comments) when modal opens/changes
  useEffect(() => {
    if (isOpen && selectedTask?._id) {
      fetchTaskById(selectedTask._id).then((fullTask) => {
        if (fullTask) {
          setEditedTitle(fullTask.title)
          setEditedDesc(fullTask.description || '')
        }
      })
    }
  }, [isOpen, selectedTask?._id]) // eslint-disable-line

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen || !selectedTask) return null

  const handleUpdate = async (field, value) => {
    await updateTask(selectedTask._id, { [field]: value })
  }

  const handleTitleSubmit = async () => {
    if (editedTitle.trim() && editedTitle !== selectedTask.title) {
      await handleUpdate('title', editedTitle)
    }
    setIsEditingTitle(false)
  }

  const handleDescSubmit = async () => {
    if (editedDesc !== selectedTask.description) {
      await handleUpdate('description', editedDesc)
    }
    setIsEditingDesc(false)
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    try {
      setAddingComment(true)
      await addComment(selectedTask._id, newComment)
      setNewComment('')
    } finally {
      setAddingComment(false)
    }
  }

  const handleDeleteTask = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(selectedTask._id)
      setSelectedTask(null)
      onClose()
    }
  }

  // Get project members list to select assignees from
  const projectMembers = selectedProject?.members || []

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative card w-full max-w-4xl max-h-[90vh] flex flex-col animate-slide-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50 bg-dark-800 flex-shrink-0">
          <div className="flex-1 mr-4">
            {isEditingTitle ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                autoFocus
                className="input text-lg font-semibold py-1 px-2 border-primary-500"
              />
            ) : (
              <h2
                className="text-lg font-semibold text-white cursor-pointer hover:text-primary-400 flex items-center gap-2 group"
                onClick={() => {
                  setEditedTitle(selectedTask.title)
                  setIsEditingTitle(true)
                }}
              >
                {selectedTask.title}
                <AiOutlineEdit className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" size={16} />
              </h2>
            )}
            <p className="text-xs text-slate-500 mt-1">
              Project: <span className="text-slate-300 font-medium">{selectedTask.project?.name || selectedProject?.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-700 transition-colors flex-shrink-0"
            id="task-detail-close-btn"
          >
            <AiOutlineClose size={18} />
          </button>
        </div>

        {/* Content Panel */}
        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto min-h-0 bg-dark-900/40">
          {/* Main Body (Left) */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto border-r border-slate-700/30">
            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-300">Description</h3>
                {!isEditingDesc && (
                  <button
                    onClick={() => {
                      setEditedDesc(selectedTask.description || '')
                      setIsEditingDesc(true)
                    }}
                    className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditingDesc ? (
                <div className="space-y-2">
                  <textarea
                    value={editedDesc}
                    onChange={(e) => setEditedDesc(e.target.value)}
                    rows={4}
                    placeholder="Provide description..."
                    className="input resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setIsEditingDesc(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleDescSubmit}>
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={`text-sm text-slate-400 whitespace-pre-wrap p-3 rounded-lg min-h-[80px] bg-dark-900/50 border border-slate-800 ${
                    !selectedTask.description ? 'italic text-slate-600' : ''
                  }`}
                >
                  {selectedTask.description || 'No description provided.'}
                </div>
              )}
            </div>

            {/* Comments Log */}
            <div className="border-t border-slate-800 pt-6">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-4">
                <AiOutlineMessage size={16} /> Comments ({selectedTask.comments?.length || 0})
              </h3>

              <div className="space-y-4 mb-4">
                {selectedTask.comments && selectedTask.comments.length > 0 ? (
                  selectedTask.comments.map((comment) => (
                    <div key={comment._id} className="flex gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {comment.user?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 bg-dark-800/80 p-3 rounded-xl border border-slate-700/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-white text-xs">{comment.user?.name}</span>
                          <span className="text-[10px] text-slate-500">{formatRelativeTime(comment.createdAt)}</span>
                        </div>
                        <p className="text-slate-300 text-sm whitespace-pre-wrap">{comment.text}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-600 italic py-2">No comments yet. Start the conversation below!</p>
                )}
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handleAddComment} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  Me
                </div>
                <div className="flex-1 space-y-2">
                  <textarea
                    rows={2}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="input text-xs resize-none"
                    id="comment-input"
                  />
                  <div className="flex justify-end">
                    <Button type="submit" variant="primary" size="sm" loading={addingComment}>
                      Comment
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar Attributes (Right) */}
          <div className="w-full md:w-80 p-6 bg-dark-800/20 space-y-5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              {/* Status Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                <select
                  value={selectedTask.status}
                  onChange={(e) => handleUpdate('status', e.target.value)}
                  className="input text-sm bg-dark-800"
                  id="task-detail-status-select"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="in-review">In Review</option>
                  <option value="done">Done</option>
                </select>
              </div>

              {/* Priority Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Priority</label>
                <select
                  value={selectedTask.priority}
                  onChange={(e) => handleUpdate('priority', e.target.value)}
                  className="input text-sm bg-dark-800"
                  id="task-detail-priority-select"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {/* Assignee Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assignee</label>
                <select
                  value={selectedTask.assignedTo?._id || ''}
                  onChange={(e) => handleUpdate('assignedTo', e.target.value || null)}
                  className="input text-sm bg-dark-800"
                  id="task-detail-assignee-select"
                >
                  <option value="">Unassigned</option>
                  {projectMembers.map((member) => (
                    <option key={member.user._id} value={member.user._id}>
                      {member.user.name} ({member.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AiOutlineCalendar size={14} /> Due Date
                </label>
                <input
                  type="date"
                  value={selectedTask.dueDate ? selectedTask.dueDate.slice(0, 10) : ''}
                  onChange={(e) => handleUpdate('dueDate', e.target.value || null)}
                  className="input text-sm bg-dark-800"
                />
              </div>

              {/* Estimated Hours Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AiOutlineClockCircle size={14} /> Estimated Hours
                </label>
                <input
                  type="number"
                  min="0"
                  value={selectedTask.estimatedHours || ''}
                  onChange={(e) => handleUpdate('estimatedHours', e.target.value ? Number(e.target.value) : null)}
                  placeholder="e.g. 5"
                  className="input text-sm bg-dark-800"
                />
              </div>
            </div>

            <div className="border-t border-slate-700/50 pt-5 space-y-4">
              <div className="text-[11px] text-slate-500 space-y-1">
                <p>Created by: {selectedTask.createdBy?.name || 'System'}</p>
                <p>Created: {formatDate(selectedTask.createdAt)}</p>
                <p>Last updated: {formatRelativeTime(selectedTask.updatedAt)}</p>
              </div>

              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteTask}
                className="w-full justify-center text-xs py-2 bg-red-950/20 border border-red-800/40 text-red-400 hover:bg-red-900 hover:text-white"
                id="task-detail-delete-btn"
              >
                <AiOutlineDelete size={14} /> Delete Task
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default TaskDetailModal
