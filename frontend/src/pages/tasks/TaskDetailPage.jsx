import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useRecoilState, useRecoilValue } from 'recoil'
import {
  AiOutlineCalendar, AiOutlineClockCircle,
  AiOutlineUser, AiOutlineDelete, AiOutlineMessage, AiOutlineEdit,
  AiOutlinePaperClip, AiOutlinePlus, AiOutlineHistory, AiOutlineComment,
  AiOutlineArrowLeft
} from 'react-icons/ai'
import { selectedTaskAtom } from '../../recoil/atoms/taskAtom'
import useTasks from '../../hooks/useTasks'
import useAuth from '../../hooks/useAuth'
import Badge from '../../components/common/Badge'
import Spinner from '../../components/common/Spinner'
import Button from '../../components/common/Button'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { formatDate, formatRelativeTime } from '../../utils/formatDate'
import ConfirmModal from '../../components/common/ConfirmModal'

const getHistoryMessage = (log) => {
  const userName = log.user?.name || 'System Actor'
  const action = log.action
  const prevVal = log.previousValue || 'None'
  const newVal = log.newValue || 'None'

  switch (action) {
    case 'STATUS_CHANGE':
      return (
        <span>
          <strong className="text-slate-300">{userName}</strong> updated status from{' '}
          <span className="text-red-400 bg-red-950/20 px-1.5 py-0.5 rounded text-[10px] font-mono">{prevVal}</span> to{' '}
          <span className="text-green-400 bg-green-950/20 px-1.5 py-0.5 rounded text-[10px] font-mono">{newVal}</span>
        </span>
      )
    case 'ASSIGNEE_CHANGE':
      return (
        <span>
          <strong className="text-slate-300">{userName}</strong> reassigned task from{' '}
          <strong className="text-slate-400">{prevVal}</strong> to{' '}
          <strong className="text-primary-400">{newVal}</strong>
        </span>
      )
    case 'DUE_DATE_CHANGE':
      return (
        <span>
          <strong className="text-slate-300">{userName}</strong> changed due date from{' '}
          <span className="text-slate-400 line-through">{prevVal}</span> to{' '}
          <span className="text-primary-400 font-bold">{newVal}</span>
        </span>
      )
    default:
      return (
        <span>
          <strong className="text-slate-300">{userName}</strong> performed action{' '}
          <span className="text-primary-400 capitalize">{action.replace(/_/g, ' ').toLowerCase()}</span>
        </span>
      )
  }
}

const TaskDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [selectedTask, setSelectedTask] = useRecoilState(selectedTaskAtom)
  const { fetchTaskById, updateTask, deleteTask, addComment, loading: taskLoading } = useTasks()
  const { user } = useAuth()

  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'details'
  const setActiveTab = (tab) => setSearchParams({ tab })
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedDesc, setEditedDesc] = useState('')
  
  // Comments
  const [newComment, setNewComment] = useState('')
  const [addingComment, setAddingComment] = useState(false)

  // Work Logs
  const [workLogs, setWorkLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logHours, setLogHours] = useState('')
  const [logDesc, setLogDesc] = useState('')
  const [logAttach, setLogAttach] = useState('')
  const [submitLogLoading, setSubmitLogLoading] = useState(false)
  const [replyInputs, setReplyInputs] = useState({}) // { logId: 'reply text' }
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)

  // Estimated Hours debounced state
  const [localHours, setLocalHours] = useState('')

  // Fetch full task details (including comments & history) on load
  useEffect(() => {
    if (id) {
      fetchTaskById(id).then((fullTask) => {
        if (fullTask) {
          setEditedTitle(fullTask.title)
          setEditedDesc(fullTask.description || '')
          setLocalHours(fullTask.estimatedHours || '')
        }
      })
      fetchWorkLogs()
    }
  }, [id]) // eslint-disable-line

  // Synchronize local hours with selectedTask.estimatedHours when it changes externally
  useEffect(() => {
    if (selectedTask?.estimatedHours !== undefined) {
      setLocalHours(selectedTask.estimatedHours || '')
    }
  }, [selectedTask?.estimatedHours])

  // Debounce Estimated Hours updates to backend
  useEffect(() => {
    const savedHours = selectedTask?.estimatedHours || ''
    if (localHours !== savedHours) {
      const delayDebounce = setTimeout(() => {
        handleUpdate('estimatedHours', localHours ? Number(localHours) : null)
      }, 800)
      return () => clearTimeout(delayDebounce)
    }
  }, [localHours]) // eslint-disable-line

  const fetchWorkLogs = async () => {
    if (!id) return
    try {
      setLogsLoading(true)
      const { data } = await api.get(`/worklogs?task=${id}`)
      setWorkLogs(data.workLogs || [])
    } catch (error) {
      console.error('Failed to load work logs', error)
    } finally {
      setLogsLoading(false)
    }
  }

  const handleUpdate = async (field, value) => {
    await updateTask(id, { [field]: value })
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
      await addComment(id, newComment)
      setNewComment('')
    } finally {
      setAddingComment(false)
    }
  }

  const handleDeleteClick = () => {
    setIsConfirmDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    setIsConfirmDeleteOpen(false)
    const projectId = selectedTask.project?._id
    await deleteTask(id)
    setSelectedTask(null)
    if (projectId) {
      navigate(`/projects/${projectId}`)
    } else {
      navigate('/tasks')
    }
  }

  const handleLogWorkSubmit = async (e) => {
    e.preventDefault()
    if (!logHours || !logDesc.trim()) {
      toast.error('Please enter description and hours worked')
      return
    }

    try {
      setSubmitLogLoading(true)
      await api.post('/worklogs', {
        task: id,
        description: logDesc,
        hoursWorked: Number(logHours),
        attachment: logAttach,
      })
      toast.success('Work log submitted successfully!')
      setLogHours('')
      setLogDesc('')
      setLogAttach('')
      fetchWorkLogs()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit work log')
    } finally {
      setSubmitLogLoading(false)
    }
  }

  const handleReplyChange = (logId, val) => {
    setReplyInputs(prev => ({ ...prev, [logId]: val }))
  }

  const handleReplySubmit = async (e, logId) => {
    e.preventDefault()
    const text = replyInputs[logId]
    if (!text || !text.trim()) return

    try {
      await api.post(`/worklogs/${logId}/replies`, { text })
      toast.success('Reply submitted!')
      setReplyInputs(prev => ({ ...prev, [logId]: '' }))
      fetchWorkLogs()
    } catch (error) {
      toast.error('Failed to submit reply')
    }
  }

  if (!selectedTask) {
    return (
      <div className="flex justify-center py-24"><Spinner size="lg" /></div>
    )
  }

  const projectMembers = selectedTask.project?.members || []

  // Check role and permissions using task's project info
  const isAssignee = selectedTask.assignedTo?._id === user?._id
  const isAdmin = user?.role === 'admin'
  const isPM = (selectedTask.project?.owner?._id || selectedTask.project?.owner) === user?._id ||
               (selectedTask.project?.assignedManager?._id || selectedTask.project?.assignedManager) === user?._id ||
               selectedTask.project?.members?.some(m => (m.user?._id || m.user) === user?._id && m.role === 'manager')
  const isProjectMember = selectedTask.project?.members?.some(m => (m.user?._id || m.user) === user?._id)
  const canEditAssigneeAndTimeline = isAdmin || isPM || isProjectMember

  const totalLoggedHours = workLogs.reduce((sum, log) => sum + log.hoursWorked, 0)

  // Combine comments and history into a unified activity feed
  const unifiedFeed = [
    ...(selectedTask.comments || []).map((c) => ({
      ...c,
      feedType: 'comment',
      date: new Date(c.createdAt),
    })),
    ...(selectedTask.history || []).map((h) => ({
      ...h,
      feedType: 'history',
      date: new Date(h.timestamp),
    })),
  ].sort((a, b) => a.date - b.date)

  return (
    <div className="animate-fade-in flex flex-col min-h-0 text-xs">
      {/* Main card panel */}
      <div className="card w-full flex flex-col overflow-hidden border border-slate-700/50 min-h-0 flex-1">
        {/* Header */}
        <div className="flex items-center justify-between p-1.5 px-3 border-b border-slate-700/50 bg-dark-800 flex-shrink-0">
          <div className="flex items-center gap-1 min-w-0">
            <Link to="/tasks" className="text-[10px] text-slate-500 hover:text-primary-400 transition-colors font-semibold">
              Tasks
            </Link>
            <span className="text-[10px] text-slate-600">/</span>
            {isEditingTitle && (isAdmin || isPM) ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                autoFocus
                className="input text-xs font-semibold py-0 px-1 border-primary-500 bg-dark-900 text-white w-auto"
              />
            ) : (
              <h2
                className={`text-xs font-semibold text-white flex items-center gap-1 group truncate ${
                  isAdmin || isPM ? 'cursor-pointer hover:text-primary-400' : ''
                }`}
                onClick={() => {
                  if (isAdmin || isPM) {
                    setEditedTitle(selectedTask.title)
                    setIsEditingTitle(true)
                  }
                }}
              >
                {selectedTask.title}
                {(isAdmin || isPM) && (
                  <AiOutlineEdit className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 flex-shrink-0" size={10} />
                )}
              </h2>
            )}
          </div>
        </div>

        {/* Content Panel */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-dark-900/40">
          {/* Main Body (Left) */}
          <div className="flex-1 p-3.5 border-r border-slate-700/30 flex flex-col min-h-0">
            {/* Tab Selection (only left side) */}
            <div className="flex border-b border-slate-700/30 flex-shrink-0 gap-4 mb-2.5">
              <button
                onClick={() => setActiveTab('details')}
                className={`pb-1.5 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === 'details' ? 'border-primary-500 text-primary-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Details & Activity
              </button>
              <button
                onClick={() => setActiveTab('worklogs')}
                className={`pb-1.5 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === 'worklogs' ? 'border-primary-500 text-primary-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Work Logs
              </button>
            </div>

            {/* DETAILS & ACTIVITY TAB */}
            {activeTab === 'details' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-2 animate-fade-in">
                <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 flex-shrink-0">
                  <AiOutlineMessage size={14} /> Activity & Chat ({unifiedFeed.length})
                </h3>

                {/* Scrolling Chat list */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1.5 bg-dark-950/20 rounded-lg p-2.5 border border-slate-800/40 min-h-[160px]">
                  {unifiedFeed.length > 0 ? (
                    unifiedFeed.map((item) => {
                      if (item.feedType === 'comment') {
                        const isCurrentUser = item.user?._id?.toString() === user?._id?.toString();
                        return (
                          <div key={item._id} className={`flex gap-2 max-w-[85%] ${isCurrentUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                            <div className="w-6 h-6 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-[9px] flex-shrink-0">
                              {item.user?.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className={`p-2 rounded-lg border ${
                              isCurrentUser 
                                ? 'bg-primary-950/40 border-primary-850/40 text-slate-250 rounded-tr-none' 
                                : 'bg-dark-800/80 border-slate-700/30 text-slate-300 rounded-tl-none'
                            }`}>
                              <div className="flex items-center justify-between gap-3 mb-0.5">
                                <span className="font-bold text-[10px] text-slate-300">{item.user?.name}</span>
                                <span className="text-[8px] text-slate-500">{formatRelativeTime(item.createdAt)}</span>
                              </div>
                              <p className="text-[11px] whitespace-pre-wrap leading-relaxed">{item.text}</p>
                            </div>
                          </div>
                        )
                      } else {
                        return (
                          <div key={item._id || `${item.timestamp}-${item.action}`} className="flex items-center justify-center py-0.5 text-[9px] text-slate-500 mx-auto max-w-[90%] text-center">
                            <span className="bg-dark-900 border border-slate-800/60 rounded-full px-2.5 py-0.5 leading-snug">
                              {getHistoryMessage(item)}
                            </span>
                          </div>
                        )
                      }
                    })
                  ) : (
                    <p className="text-[10px] text-slate-600 italic py-4 text-center">No activity or comments yet. Type a message below!</p>
                  )}
                </div>

                {/* Add Comment Input at bottom */}
                <form onSubmit={handleAddComment} className="flex gap-2 items-end flex-shrink-0 bg-dark-900/60 p-2 rounded-lg border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-primary-700 text-white flex items-center justify-center font-bold text-[9px] flex-shrink-0 mb-1">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <textarea
                      rows={1}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Type a message..."
                      className="w-full text-xs bg-transparent border-none focus:ring-0 p-1 min-h-[30px] max-h-[70px] resize-none text-slate-200 placeholder-slate-500"
                      style={{ outline: 'none', boxShadow: 'none' }}
                      id="comment-input"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment(e);
                        }
                      }}
                    />
                  </div>
                  <Button type="submit" variant="primary" size="xs" loading={addingComment} className="flex-shrink-0 py-1 px-2.5">
                    Send
                  </Button>
                </form>
              </div>
            )}

            {/* WORK LOGS TAB */}
            {activeTab === 'worklogs' && (
              <div className="space-y-4 animate-fade-in flex flex-col min-h-0">
                <div className="flex items-center justify-between bg-dark-800/40 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <AiOutlineClockCircle className="text-primary-400" size={16} />
                    <span className="text-[11px] font-semibold text-slate-300">Logged Hours Summary</span>
                  </div>
                  <span className="text-[9px] font-bold bg-dark-900 px-2 py-0.5 rounded-full text-slate-200">
                    Total: <strong className="text-primary-400">{totalLoggedHours}h</strong> / {selectedTask.estimatedHours || 0}h est
                  </span>
                </div>

                {/* Log Hours Form (Only for Assignee or Admin/PM acting) */}
                {(isAssignee || isAdmin || isPM) && (
                  <form onSubmit={handleLogWorkSubmit} className="bg-dark-800/30 p-3 rounded-lg border border-slate-700/30 space-y-3">
                    <h4 className="text-[9px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                      <AiOutlinePlus size={10} /> Submit Effort Log
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          value={logDesc}
                          onChange={(e) => setLogDesc(e.target.value)}
                          placeholder="What did you work on? *"
                          className="input text-xs py-1 bg-dark-900"
                          required
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          value={logHours}
                          onChange={(e) => setLogHours(e.target.value)}
                          placeholder="Hours *"
                          className="input text-xs py-1 bg-dark-900"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={logAttach}
                          onChange={(e) => setLogAttach(e.target.value)}
                          placeholder="Attachment URL (optional)"
                          className="input text-xs py-1 bg-dark-900"
                        />
                      </div>
                      <Button type="submit" variant="primary" size="xs" loading={submitLogLoading}>
                        Submit
                      </Button>
                    </div>
                  </form>
                )}

                {/* Effort Logs list */}
                <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
                  <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Effort History</h4>
                  {logsLoading && workLogs.length === 0 ? (
                    <div className="flex justify-center py-6"><Spinner size="xs" /></div>
                  ) : workLogs.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic py-1">No effort logs submitted for this task yet.</p>
                  ) : (
                    workLogs.map((log) => (
                      <div key={log._id} className="card p-3 space-y-2 border border-slate-800 bg-dark-850/30 text-xs">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-slate-700 text-slate-200 font-bold text-[9px] flex items-center justify-center">
                              {log.employee?.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-200 text-xs">{log.employee?.name}</p>
                              <p className="text-[9px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                          <span className="bg-primary-950/40 text-primary-400 border border-primary-800/40 px-2 py-0.5 rounded-full font-bold text-[9px]">
                            {log.hoursWorked} hrs
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap">{log.description}</p>
                        {log.attachment && (
                          <div className="flex items-center gap-1 text-[10px] text-primary-400 hover:underline">
                            <AiOutlinePaperClip size={10} />
                            <a href={log.attachment} target="_blank" rel="noreferrer" className="truncate max-w-sm">
                              {log.attachment}
                            </a>
                          </div>
                        )}

                        {/* Log replies conversation history */}
                        <div className="border-t border-slate-800/60 pt-2 space-y-2">
                          {log.replies && log.replies.length > 0 && (
                            <div className="pl-4 space-y-1.5 border-l-2 border-slate-800">
                              {log.replies.map((reply) => (
                                <div key={reply._id} className="text-[10px] space-y-0.5 bg-dark-900/40 p-2 rounded border border-slate-800/50">
                                  <div className="flex justify-between text-[8px] text-slate-500 font-bold uppercase">
                                    <span className="text-slate-300 font-semibold">{reply.name}</span>
                                    <span>{new Date(reply.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-slate-400">{reply.text}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Reply Input Form */}
                          <form onSubmit={(e) => handleReplySubmit(e, log._id)} className="flex gap-1.5 pl-4">
                            <input
                              type="text"
                              placeholder="Reply to effort log..."
                              value={replyInputs[log._id] || ''}
                              onChange={(e) => handleReplyChange(log._id, e.target.value)}
                              className="input text-[11px] py-1 bg-dark-900 border-slate-700/60 placeholder-slate-500"
                            />
                            <button
                              type="submit"
                              className="bg-dark-800 text-slate-300 border border-slate-700 hover:text-white hover:bg-dark-700 p-1.5 rounded transition-colors flex-shrink-0"
                              title="Send reply"
                            >
                              <AiOutlineComment size={12} />
                            </button>
                          </form>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Attributes (Right) */}
          <div className="w-full md:w-64 p-3.5 bg-dark-800/20 space-y-3.5 flex flex-col justify-between flex-shrink-0 text-xs overflow-y-auto border-t md:border-t-0 md:border-l border-slate-700/30">
            <div className="space-y-3.5">
              {/* Project Title (right side) */}
              <div>
                <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Project</label>
                <div className="text-slate-200 font-medium truncate bg-dark-800/60 p-1.5 px-2 rounded border border-slate-800/80">
                  📁 {selectedTask.project?.name || 'Unknown Project'}
                </div>
              </div>

              {/* Description (right side) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Description</label>
                  {!isEditingDesc && (isAdmin || isPM) && (
                    <button
                      onClick={() => {
                        setEditedDesc(selectedTask.description || '')
                        setIsEditingDesc(true)
                      }}
                      className="text-[9px] text-primary-400 hover:text-primary-300 flex items-center gap-0.5"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {isEditingDesc ? (
                  <div className="space-y-1">
                    <textarea
                      value={editedDesc}
                      onChange={(e) => setEditedDesc(e.target.value)}
                      rows={3}
                      placeholder="Provide description..."
                      className="input text-xs resize-none p-1.5 bg-dark-900 text-slate-200"
                    />
                    <div className="flex justify-end gap-1">
                      <Button variant="secondary" size="xs" onClick={() => setIsEditingDesc(false)} className="py-0.5 px-1.5 text-[10px]">
                        Cancel
                      </Button>
                      <Button variant="primary" size="xs" onClick={handleDescSubmit} className="py-0.5 px-1.5 text-[10px]">
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`text-[11px] text-slate-400 whitespace-pre-wrap p-2 rounded bg-dark-900/40 border border-slate-800/80 min-h-[40px] leading-normal ${
                      !selectedTask.description ? 'italic text-slate-600' : ''
                    }`}
                  >
                    {selectedTask.description || 'No description provided.'}
                  </div>
                )}
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Status</label>
                <select
                  value={selectedTask.status}
                  onChange={(e) => handleUpdate('status', e.target.value)}
                  className="input text-xs py-1 bg-dark-800 text-white"
                  id="task-detail-status-select"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="in-review">In Review</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              {/* Priority Selector (Only Admin/PM can edit, Employees read-only) */}
              <div>
                <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Priority</label>
                {isAdmin || isPM ? (
                  <select
                    value={selectedTask.priority}
                    onChange={(e) => handleUpdate('priority', e.target.value)}
                    className="input text-xs py-1 bg-dark-800 text-white"
                    id="task-detail-priority-select"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                ) : (
                  <div className="capitalize text-slate-300 pl-0.5 text-xs font-semibold">
                    <Badge type="priority" value={selectedTask.priority} className="text-[10px] px-2 py-0.5" />
                  </div>
                )}
              </div>

              {/* Assignee Selector (Admin/PM/Project Member can edit) */}
              <div>
                <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Assignee</label>
                {canEditAssigneeAndTimeline ? (
                  <select
                    value={selectedTask.assignedTo?._id || ''}
                    onChange={(e) => handleUpdate('assignedTo', e.target.value || null)}
                    className="input text-xs py-1 bg-dark-800 text-white"
                    id="task-detail-assignee-select"
                  >
                    <option value="">Unassigned</option>
                    {projectMembers.map((member) => (
                      <option key={member.user?._id || member.user} value={member.user?._id || member.user}>
                        {member.user?.name || 'Unknown'} ({member.role})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs pl-0.5 font-semibold text-slate-300">
                    <div className="w-4.5 h-4.5 rounded-full bg-slate-700 text-slate-200 text-[9px] font-bold flex-shrink-0 flex items-center justify-center">
                      {selectedTask.assignedTo?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span>{selectedTask.assignedTo?.name || 'Unassigned'}</span>
                  </div>
                )}
              </div>

              {/* Due Date Picker (Admin/PM/Project Member can edit) */}
              <div>
                <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <AiOutlineCalendar size={12} /> Due Date
                </label>
                {canEditAssigneeAndTimeline ? (
                  <input
                    type="date"
                    value={selectedTask.dueDate ? selectedTask.dueDate.slice(0, 10) : ''}
                    onChange={(e) => handleUpdate('dueDate', e.target.value || null)}
                    className="input text-xs py-1 bg-dark-800 text-white"
                  />
                ) : (
                  <p className="text-xs text-slate-300 font-semibold pl-0.5">
                    {selectedTask.dueDate ? formatDate(selectedTask.dueDate) : 'N/A'}
                  </p>
                )}
              </div>

              {/* Estimated Hours Input (Only Admin/PM can edit, Employees read-only) */}
              <div>
                <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <AiOutlineClockCircle size={12} /> Estimated Hours
                </label>
                {isAdmin || isPM ? (
                  <input
                    type="number"
                    min="0"
                    value={localHours}
                    onChange={(e) => setLocalHours(e.target.value)}
                    placeholder="e.g. 5"
                    className="input text-xs py-1 bg-dark-800 text-white"
                  />
                ) : (
                  <p className="text-xs text-slate-300 font-semibold pl-0.5">
                    {selectedTask.estimatedHours ? `${selectedTask.estimatedHours} hrs` : 'N/A'}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-slate-700/50 pt-4 space-y-3">
              <div className="text-[9px] text-slate-500 space-y-0.5 pl-0.5">
                <p>Created by: {selectedTask.createdBy?.name || 'System'}</p>
                <p>Created: {formatDate(selectedTask.createdAt)}</p>
                <p>Last updated: {formatRelativeTime(selectedTask.updatedAt)}</p>
              </div>

              {(isAdmin || isPM) && (
                <Button
                  variant="danger"
                  size="xs"
                  onClick={handleDeleteClick}
                  className="w-full justify-center text-[10px] py-1.5 bg-red-950/20 border border-red-800/40 text-red-400 hover:bg-red-900 hover:text-white"
                  id="task-detail-delete-btn"
                >
                  <AiOutlineDelete size={12} /> Delete Task
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action is permanent and cannot be undone."
        confirmText="Delete Task"
        type="danger"
        loading={taskLoading}
      />
    </div>
  )
}

export default TaskDetailPage
